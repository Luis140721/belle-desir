import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { getPagination, getPagingData } from '../../shared/utils/pagination';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schemas';
import axios from 'axios';
import { BOLD_API_URL, getBoldHeaders } from '../../config/bold';
import { sendOrderConfirmation, sendOrderStatusUpdate, OrderData } from '../../services/emailService';

type BoldPaymentState = 'APPROVED' | 'REJECTED' | 'PENDING' | 'UNKNOWN';

interface PaymentStatusResult {
  orderId: string;
  orderStatus: string;
  boldStatus: BoldPaymentState;
  paymentLink: string | null;
  checkoutUrl: string | null;
  transactionId: string | null;
  message: string;
}

export class OrderService {
  static async createOrder(userId: string, data: CreateOrderInput) {
    if (!userId) {
      throw new AppError('Debes iniciar sesion para comprar', 401);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const resolvedItems = cart && cart.items.length > 0
      ? cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      : data.items ?? [];

    if (!resolvedItems.length) {
      throw new AppError('El carrito esta vacio', 400);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: resolvedItems.map((item) => item.productId) }, isActive: true },
    });

    if (products.length !== resolvedItems.length) {
      throw new AppError('Uno o mas productos no estan disponibles', 400);
    }

    for (const item of resolvedItems) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        throw new AppError(`Producto ${item.productId} no encontrado`, 400);
      }
      if (product.stock === 0) {
        throw new AppError(`Producto "${product.name}" esta agotado`, 400);
      }
      if (item.quantity > product.stock) {
        throw new AppError(`Stock insuficiente para "${product.name}". Solo ${product.stock} unidades disponibles.`, 400);
      }
    }

    const subtotal = resolvedItems.reduce((sum, item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const shipping = subtotal > 150000 ? 0 : 15000;
    const total = subtotal + shipping;

    const shippingAddressData = {
      ...data.shippingAddress,
      city: data.shippingAddress.city || 'Bogota',
      country: data.shippingAddress.country || 'Colombia',
      zip: data.shippingAddress.zip || '000000',
    };

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          subtotal,
          shipping,
          total,
          shippingAddress: shippingAddressData,
          items: {
            create: resolvedItems.map((item) => {
              const product = products.find((candidate) => candidate.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
                productSnapshot: { ...product },
              };
            }),
          },
        },
        include: { items: true },
      });

      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    });

    const orderData: OrderData = {
      id: order.id,
      items: order.items.map(item => ({
        name: (item.productSnapshot as any).name as string,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      total: Number(order.total),
      shippingAddress: shippingAddressData,
    };

    const userEmail = (await prisma.user.findUnique({ where: { id: userId } }))?.email;
    if (userEmail) {
      await sendOrderConfirmation(userEmail, orderData);
    }

    const boldPayload = {
      amount_type: 'CLOSE',
      amount: {
        currency: 'COP',
        total_amount: Math.floor(total),
        tip_amount: 0,
      },
      reference: order.id,
      description: `Pedido Belle Desir #${order.id.slice(0, 8).toUpperCase()}`,
      expiration_date: Math.floor((Date.now() + 30 * 60 * 1000) * 1e6),
      payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
      callback_url: `${env.FRONTEND_URL.split(',')[0]}/pedido-confirmado?orderId=${order.id}`,
    };

    try {
      const { data: boldResponse } = await axios.post(
        `${BOLD_API_URL}/online/link/v1`,
        boldPayload,
        { headers: getBoldHeaders() }
      );

      const paymentLink = boldResponse.payload.payment_link;
      const checkoutUrl = boldResponse.payload.url;

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: paymentLink },
      });

      return { orderId: order.id, checkoutUrl, paymentLink };
    } catch (error: any) {
      console.error('Error generating Bold payment link', {
        orderId: order.id,
        message: error?.message,
        status: error?.response?.status,
        responseData: error?.response?.data,
        requestUrl: `${BOLD_API_URL}/online/link/v1`,
      });
      return { orderId: order.id, checkoutUrl: null, paymentLink: null };
    }
  }

  static async getPublicPaymentStatus(orderId: string, redirectStatus?: string): Promise<PaymentStatusResult & { orderData?: any }> {
    const orderSelect = {
      id: true,
      status: true,
      stripeSessionId: true,
      stripePaymentIntentId: true,
      total: true,
      subtotal: true,
      shipping: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          product: {
            select: { name: true, images: true }
          }
        }
      }
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: orderSelect,
    });

    if (!order) throw new AppError('Order not found', 404);

    if (order.status === 'PAID') {
      return { ...this.buildPaymentStatus(order, 'APPROVED', 'Tu pago ya fue confirmado.'), orderData: order };
    }

    if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
      return { ...this.buildPaymentStatus(order, 'REJECTED', 'El pago fue rechazado o cancelado.'), orderData: order };
    }

    // ── 1. Intentar fallback por API de Bold ──────────────────
    let resolved = false;

    const fallback = await this.fetchBoldFallbackNotification(order.id);
    if (fallback?.orderId) {
      if (fallback.boldStatus === 'APPROVED') {
        await this.markOrderPaid(fallback.orderId, fallback.transactionId);
        resolved = true;
      } else if (fallback.boldStatus === 'REJECTED') {
        await this.markOrderCancelled(fallback.orderId, fallback.transactionId);
        resolved = true;
      }
    }

    if (!resolved && order.stripeSessionId) {
      const linkStatus = await this.fetchBoldPaymentLinkStatus(order.stripeSessionId);
      if (linkStatus?.boldStatus === 'APPROVED') {
        await this.markOrderPaid(order.id, linkStatus.transactionId);
        resolved = true;
      } else if (linkStatus?.boldStatus === 'REJECTED') {
        await this.markOrderCancelled(order.id, linkStatus.transactionId);
        resolved = true;
      }
    }

    // ── 2. Si la API no devolvió resultado, usar el redirect status de Bold ──
    if (!resolved && redirectStatus) {
      const mappedStatus = mapBoldNotificationStatus(redirectStatus);
      console.info('[PaymentStatus] API fallback sin resultado, usando redirectStatus:', {
        orderId, redirectStatus, mappedStatus,
      });

      if (mappedStatus === 'APPROVED') {
        await this.markOrderPaid(order.id, null);
        resolved = true;
      } else if (mappedStatus === 'REJECTED') {
        await this.markOrderCancelled(order.id, null);
        resolved = true;
      }
    }

    // ── 3. Re-leer la orden actualizada ──────────────────────
    const refreshed = await prisma.order.findUnique({
      where: { id: orderId },
      select: orderSelect,
    });

    if (!refreshed) throw new AppError('Order not found', 404);

    const boldStatus = refreshed.status === 'PAID'
      ? 'APPROVED'
      : ['CANCELLED', 'REFUNDED'].includes(refreshed.status)
        ? 'REJECTED'
        : fallback?.boldStatus ?? 'PENDING';

    return {
      ...this.buildPaymentStatus(
        refreshed,
        boldStatus,
        boldStatus === 'PENDING'
          ? 'Estamos esperando la confirmacion de Bold.'
          : 'Estado de pago actualizado.'
      ),
      orderData: refreshed
    };
  }

  static async applyBoldNotification(payload: any) {
    const parsed = this.parseBoldNotification(payload);
    if (!parsed.orderId) return parsed;

    if (parsed.boldStatus === 'APPROVED') {
      await this.markOrderPaid(parsed.orderId, parsed.transactionId);
    } else if (parsed.boldStatus === 'REJECTED') {
      await this.markOrderCancelled(parsed.orderId, parsed.transactionId);
    }

    return parsed;
  }

  static async getUserOrders(userId: string, query: any) {
    const { page, limit } = query;
    const { take, skip } = getPagination(page ? +page : 1, limit ? +limit : 10);

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        take, skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { data: orders, meta: getPagingData(total, page ? +page : 1, limit ? +limit : 10) };
  }

  static async getOrderById(userId: string, orderId: string, role: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId && role !== 'ADMIN') throw new AppError('Unauthorized', 403);

    return order;
  }

  static async getAdminOrders(query: any) {
    const { page, limit, status, userId } = query;
    const { take, skip } = getPagination(page ? +page : 1, limit ? +limit : 10);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where, take, skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, meta: getPagingData(total, page ? +page : 1, limit ? +limit : 10) };
  }

  static async updateOrderStatus(orderId: string, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === data.status) return order;

    return await prisma.$transaction(async (tx) => {
      if (order.status === 'PAID' && ['CANCELLED', 'REFUNDED'].includes(data.status)) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      if (order.status !== 'PAID' && data.status === 'PAID') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: data.status },
      });
    });
  }

  private static async markOrderPaid(orderId: string, transactionId?: string | null) {
    await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!currentOrder || currentOrder.status === 'PAID') return;

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          ...(transactionId && { stripePaymentIntentId: transactionId }),
        },
        include: { items: true },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      try {
        const user = await tx.user.findUnique({ where: { id: order.userId } });
        if (user?.email) {
          const orderData: OrderData = {
            id: order.id,
            items: order.items.map((item: any) => ({
              name: (item.productSnapshot as any).name as string,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
            })),
            total: Number(order.total),
            shippingAddress: order.shippingAddress as any,
          };
          await sendOrderStatusUpdate(user.email, orderData, 'PAID');
        }
      } catch (emailError) {
        console.warn('[Orders] No se pudo enviar email de pago confirmado:', emailError);
      }
    });
  }

  private static async markOrderCancelled(orderId: string, transactionId?: string | null) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || order.status === 'CANCELLED') return;

      if (order.status === 'PAID') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          ...(transactionId && { stripePaymentIntentId: transactionId }),
        },
      });
    });
  }

  private static async fetchBoldFallbackNotification(orderId: string) {
    if (!env.BOLD_API_KEY) return null;

    try {
      const { data } = await axios.get(
        `${BOLD_API_URL}/payments/webhook/notifications/${encodeURIComponent(orderId)}?is_external_reference=true`,
        { headers: getBoldHeaders(), timeout: 8000 }
      );
      const notification = Array.isArray(data?.notifications) ? data.notifications[0] : null;
      return notification ? this.parseBoldNotification(notification) : null;
    } catch (error: any) {
      console.warn('[BoldFallback] No se pudo consultar notificacion por referencia', {
        orderId,
        status: error?.response?.status,
        message: error?.message,
      });
      return null;
    }
  }

  private static async fetchBoldPaymentLinkStatus(paymentLink: string) {
    if (!env.BOLD_API_KEY) return null;

    try {
      const { data } = await axios.get(
        `${BOLD_API_URL}/online/link/v1/${encodeURIComponent(paymentLink)}`,
        { headers: getBoldHeaders(), timeout: 8000 }
      );
      return {
        boldStatus: mapBoldLinkStatus(data?.status),
        transactionId: data?.transaction_id ?? null,
      };
    } catch (error: any) {
      console.warn('[BoldFallback] No se pudo consultar link de pago', {
        paymentLink,
        status: error?.response?.status,
        message: error?.message,
      });
      return null;
    }
  }

  private static parseBoldNotification(payload: any) {
    const transaction = payload?.transaction;
    const data = payload?.data ?? transaction ?? {};
    const type = payload?.type as string | undefined;
    const rawStatus = transaction?.status ?? type ?? data?.status;
    const metadata = data?.metadata ?? transaction?.metadata ?? {};

    return {
      orderId:
        transaction?.order_reference ??
        metadata?.reference ??
        data?.reference ??
        payload?.reference ??
        null,
      boldStatus: mapBoldNotificationStatus(rawStatus),
      transactionId:
        data?.payment_id ??
        payload?.subject ??
        transaction?.id ??
        transaction?.payment_id ??
        null,
      rawStatus,
    };
  }

  private static buildPaymentStatus(
    order: { id: string; status: string; stripeSessionId: string | null; stripePaymentIntentId: string | null },
    boldStatus: BoldPaymentState,
    message: string
  ): PaymentStatusResult {
    return {
      orderId: order.id,
      orderStatus: order.status,
      boldStatus,
      paymentLink: order.stripeSessionId,
      checkoutUrl: order.stripeSessionId ? `https://checkout.bold.co/${order.stripeSessionId}` : null,
      transactionId: order.stripePaymentIntentId,
      message,
    };
  }
}

function mapBoldNotificationStatus(status: string | undefined): BoldPaymentState {
  const normalized = String(status ?? '').toUpperCase();
  if (['APPROVED', 'SALE_APPROVED', 'VOID_REJECTED'].includes(normalized)) return 'APPROVED';
  if (['DECLINED', 'REJECTED', 'SALE_REJECTED', 'VOIDED', 'VOID_APPROVED', 'ERROR', 'FAILED', 'CANCELLED'].includes(normalized)) return 'REJECTED';
  if (['PENDING', 'PROCESSING', 'ACTIVE'].includes(normalized)) return 'PENDING';
  return 'UNKNOWN';
}

function mapBoldLinkStatus(status: string | undefined): BoldPaymentState {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'PAID') return 'APPROVED';
  if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(normalized)) return 'REJECTED';
  if (['ACTIVE', 'PROCESSING'].includes(normalized)) return 'PENDING';
  return 'UNKNOWN';
}
