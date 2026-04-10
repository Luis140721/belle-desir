import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { getPagination, getPagingData } from '../../shared/utils/pagination';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schemas';
import axios from 'axios';
import { BOLD_API_URL, getBoldHeaders } from '../../config/bold';
import { sendOrderConfirmation, sendOrderStatusUpdate, OrderData } from '../../services/emailService';

export class OrderService {

  /**
   * Crea una orden.
   *
   * - Si userId está presente (usuario autenticado) toma los ítems del
   *   carrito en base de datos (y opcionalmente los del body).
   * - Si userId es null (invitado) los ítems DEBEN llegar en data.items.
   */
  static async createOrder(userId: string | null, data: CreateOrderInput) {

    // ── 1. Resolver los ítems ────────────────────────────────
    let resolvedItems: Array<{ productId: string; quantity: number }> = [];

    if (userId) {
      // Usuario autenticado: intenta tomar del carrito DB
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (cart && cart.items.length > 0) {
        resolvedItems = cart.items.map((i) => ({
          productId: i.productId,
          quantity:  i.quantity,
        }));
      } else if (data.items?.length) {
        // Carrito DB vacío pero el front envió items (respaldo)
        resolvedItems = data.items;
      } else {
        throw new AppError('El carrito está vacío', 400);
      }
    } else {
      // Invitado: los items son obligatorios en el body
      if (!data.items?.length) {
        throw new AppError('Se requieren los ítems del carrito', 400);
      }
      resolvedItems = data.items;
    }

    // ── 2. Validar stock y calcular totales ──────────────────
    const products = await prisma.product.findMany({
      where: { id: { in: resolvedItems.map((i) => i.productId) }, isActive: true },
    });

    if (products.length !== resolvedItems.length) {
      throw new AppError('Uno o más productos no están disponibles', 400);
    }

    // Validar stock de TODOS los items antes de crear la orden
    for (const item of resolvedItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new AppError(`Producto ${item.productId} no encontrado`, 400);
      }
      if (product.stock === 0) {
        throw new AppError(`Producto "${product.name}" está agotado`, 400);
      }
      if (item.quantity > product.stock) {
        throw new AppError(`Stock insuficiente para "${product.name}". Solo ${product.stock} unidades disponibles.`, 400);
      }
    }

    const subtotal = resolvedItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const shipping = subtotal > 150000 ? 0 : 15000;
    const total    = subtotal + shipping;

    // ── 3. Crear la orden en transacción ─────────────────────
    // Para invitados guardamos sus datos en shippingAddress
    const shippingAddressData = {
      ...data.shippingAddress,
      // Ciudad y país fijos — la tienda solo despacha en Bogotá, Colombia
      city:    'Bogotá',
      country: 'Colombia',
      zip: (data.shippingAddress as any).zip || '000000',
      // Enriquecemos con datos del invitado si no vienen en shippingAddress
      email: data.shippingAddress.email ?? data.guestEmail,
      name:  data.shippingAddress.name  || data.guestName  || 'Invitado',
      phone: data.shippingAddress.phone || data.guestPhone,
    };

    const order = await prisma.$transaction(async (tx) => {
      // Para invitados necesitamos un userId-nullable o creamos usuario fantasma.
      // Nuestra estrategia: creamos un usuario guest en cada orden.
      // Si el email ya pertenece a un usuario real, lo vinculamos.
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const guestEmail = data.guestEmail ?? shippingAddressData.email;
        if (!guestEmail) {
          throw new AppError('Se requiere un email para procesar el pedido', 400);
        }

        // Busca si ya existe un usuario con ese email
        let guestUser = await tx.user.findUnique({ where: { email: guestEmail } });

        if (!guestUser) {
          // Crea un usuario guest con contraseña aleatoria (nunca podrán loguearse
          // con ella a menos que hagan "olvidé mi contraseña")
          const { randomBytes } = await import('crypto');
          const randomPassword  = randomBytes(32).toString('hex');
          const bcrypt          = await import('bcryptjs');
          const hashedPassword  = await bcrypt.hash(randomPassword, 10);

          guestUser = await tx.user.create({
            data: {
              email:    guestEmail,
              name:     shippingAddressData.name,
              password: hashedPassword,
              phone:    shippingAddressData.phone ?? null,
            },
          });
        }

        effectiveUserId = guestUser.id;
      }

      const newOrder = await tx.order.create({
        data: {
          userId:          effectiveUserId,
          status:          'PENDING',
          subtotal,
          shipping,
          total,
          shippingAddress: shippingAddressData,
          items: {
            create: resolvedItems.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId:       item.productId,
                quantity:        item.quantity,
                unitPrice:       product.price,
                productSnapshot: { ...product },
              };
            }),
          },
        },
        include: { items: true },
      });

      // Vacía el carrito DB si el usuario está autenticado
      if (userId) {
        const cart = await tx.cart.findUnique({ where: { userId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }

      return newOrder;
    });

    // 4. Enviar email de confirmación de orden
    const orderData: OrderData = {
      id: order.id,
      items: order.items.map(item => ({
        name: (item.productSnapshot as any).name as string,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      total: Number(order.total),
      shippingAddress: {
        ...shippingAddressData,
        zip: shippingAddressData.zip || '000000',
      },
    };

    // Obtener email del usuario
    const userEmail = userId 
      ? (await prisma.user.findUnique({ where: { id: userId } }))?.email
      : data.guestEmail || shippingAddressData.email;

    if (userEmail) {
      await sendOrderConfirmation(userEmail, orderData);
    }

    // 5. Generar link de pago Bold ─────────────────────────
    const boldPayload = {
      amount_type: 'CLOSE',
      amount: {
        currency: 'COP',
        total_amount: Math.floor(total),
        tip_amount: 0,
      },
      reference: order.id,
      description: `Pedido Belle Désir #${order.id.slice(0, 8).toUpperCase()}`,
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

      // Guardar el link en stripeSessionId (reutilizando campo)
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: paymentLink },
      });

      return {
        orderId: order.id,
        checkoutUrl,
        paymentLink,
      };
    } catch (error: any) {
      console.error('Error generating Bold payment link', {
        orderId: order.id,
        message: error?.message,
        status: error?.response?.status,
        responseData: error?.response?.data,
        responseHeaders: error?.response?.headers,
        requestUrl: `${BOLD_API_URL}/online/link/v1`,
        requestPayload: boldPayload,
      });
      return {
        orderId: order.id,
        checkoutUrl: null,
        paymentLink: null,
      };
    }
  }

  static async getUserOrders(userId: string, query: any) {
    const { page, limit } = query;
    const { take, skip }  = getPagination(page ? +page : 1, limit ? +limit : 10);

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

    // Si el nuevo estado es el mismo, no hacer nada
    if (order.status === data.status) return order;

    return await prisma.$transaction(async (tx) => {
      // Caso 1: La orden pasa de PAID a CANCELLED o REFUNDED -> Devolvemos stock
      if (order.status === 'PAID' && ['CANCELLED', 'REFUNDED'].includes(data.status)) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // Caso 2: La orden pasa de PENDING/CANCELLED a PAID -> Reducimos stock
      // (Útil para cambios manuales del admin)
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
