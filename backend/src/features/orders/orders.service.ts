import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schemas';
import { env } from '../../config/env';
import { getPagination, getPagingData } from '../../shared/utils/pagination';

export class OrderService {
  static async createOrder(userId: string, data: CreateOrderInput) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Calcula Subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    // Regla: Envio gratis sobre 150000 COP, sino 15000
    const shipping = subtotal > 150000 ? 0 : 15000;
    const total = subtotal + shipping;

    // Crear orden en transaccion
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          subtotal,
          shipping,
          total,
          shippingAddress: data.shippingAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              productSnapshot: { ...item.product },
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // Retorna la orden para que el Frontend abra el Widget de Wompi
    return {
      orderId: order.id,
      amountInCents: total * 100, // Wompi requiere montos en centavos
      currency: 'COP',
      publicKey: env.WOMPI_PUBLIC_KEY || '',
      redirectUrl: `${env.FRONTEND_URL}/checkout/success?orderId=${order.id}`,
    };
  }

  static async getUserOrders(userId: string, query: any) {
    const { page, limit } = query;
    const { take, skip } = getPagination(page ? +page : 1, limit ? +limit : 10);

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        take,
        skip,
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
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, meta: getPagingData(total, page ? +page : 1, limit ? +limit : 10) };
  }

  static async updateOrderStatus(orderId: string, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    return prisma.order.update({
      where: { id: orderId },
      data: { status: data.status },
    });
  }
}
