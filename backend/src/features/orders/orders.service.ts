import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { getPagination, getPagingData } from '../../shared/utils/pagination';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schemas';
import axios from 'axios';
import { BOLD_API_URL, getBoldHeaders } from '../../config/bold';
import { sendOrderConfirmation, sendOrderStatusUpdate, OrderData } from '../../services/emailService';

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
      callback_url: `${env.FRONTEND_URL.split(',')[0]}/pedido-confirmado`,
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
}
