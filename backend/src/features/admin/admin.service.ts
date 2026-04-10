import { prisma } from '../../config/database';

export class AdminService {
  static async getStats() {
    // Total ventas (PAID + DELIVERED + SHIPPED)
    const validOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PAID', 'DELIVERED', 'SHIPPED'],
        },
      },
      select: { total: true, createdAt: true },
    });

    const totalSales = validOrders.reduce((sum, order) => sum + Number(order.total), 0);

    // Conteo por status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    // Productos con stock < 5
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 5 } },
      select: { id: true, name: true, stock: true },
    });

    // Top 5 productos mas vendidos
    const topSellingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Resolve product names for top selling
    const topProductsDetailed = await Promise.all(
      topSellingProducts.map(async (p) => {
        const prod = await prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } });
        return {
          productId: p.productId,
          name: prod?.name || 'Unknown',
          quantitySold: p._sum.quantity,
        };
      })
    );

    // Ingresos ulitmos 30 dias agrupados por dia
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = validOrders.filter((o) => o.createdAt >= thirtyDaysAgo);

    const revenueByDay: Record<string, number> = {};
    recentOrders.forEach((o) => {
      const day = o.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.total);
    });

    return {
      totalSales,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
      lowStockProducts,
      topSellingProducts: topProductsDetailed,
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
    };
  }
}
