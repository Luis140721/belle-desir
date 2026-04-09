import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { getPagination, getPagingData } from '../../shared/utils/pagination';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.schemas';

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

    return {
      orderId:       order.id,
      amountInCents: total * 100,
      currency:      'COP',
      publicKey:     env.WOMPI_PUBLIC_KEY ?? '',
      redirectUrl:   `${env.FRONTEND_URL.split(',')[0]}/checkout/success?orderId=${order.id}`,
    };
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
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    return prisma.order.update({
      where: { id: orderId },
      data:  { status: data.status },
    });
  }
}
