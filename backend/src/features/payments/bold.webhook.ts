import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export const boldWebhookHandler = async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body;

    if (!transaction) {
      return res.status(200).json({ received: true });
    }

    const { status, order_reference } = transaction;

    if (!order_reference) {
      return res.status(200).json({ received: true });
    }

    if (status === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        // Solo procesar si la orden no está ya PAID
        const currentOrder = await tx.order.findUnique({ where: { id: order_reference } });
        if (currentOrder?.status === 'PAID') return;

        // Actualizar orden a PAID
        const order = await tx.order.update({
          where: { id: order_reference },
          data: { status: 'PAID' },
          include: { items: true },
        });

        // Reducir stock de cada producto
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      });

      console.log(`✅ Orden ${order_reference} marcada como PAID`);
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
      await prisma.$transaction(async (tx) => {
        // Obtener la orden antes de actualizar para ver su estado previo
        const order = await tx.order.findUnique({
          where: { id: order_reference },
          include: { items: true },
        });

        if (!order || order.status === 'CANCELLED') return;

        // Si la orden estaba PAID, devolvemos el stock
        if (order.status === 'PAID') {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
          console.log(`🔄 Stock devuelto para la orden ${order_reference} (era PAID)`);
        }

        // Marcar como CANCELLED
        await tx.order.update({
          where: { id: order_reference },
          data: { status: 'CANCELLED' },
        });
      });

      console.log(`❌ Orden ${order_reference} marcada como CANCELLED (${status})`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Bold webhook error:', error);
    // Siempre responder 200 para que Bold no reintente
    return res.status(200).json({ received: true });
  }
};
