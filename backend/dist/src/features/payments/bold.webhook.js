"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boldWebhookHandler = void 0;
const database_1 = require("../../config/database");
const emailService_1 = require("../../services/emailService");
const boldWebhookHandler = async (req, res) => {
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
            await database_1.prisma.$transaction(async (tx) => {
                // Solo procesar si la orden no está ya PAID
                const currentOrder = await tx.order.findUnique({ where: { id: order_reference } });
                if (currentOrder?.status === 'PAID')
                    return;
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
                // Enviar email de confirmación de pago
                const user = await tx.user.findUnique({ where: { id: order.userId } });
                if (user?.email) {
                    const orderData = {
                        id: order.id,
                        items: order.items.map((item) => ({
                            name: item.productSnapshot.name,
                            quantity: item.quantity,
                            unitPrice: Number(item.unitPrice),
                        })),
                        total: Number(order.total),
                        shippingAddress: order.shippingAddress,
                    };
                    await (0, emailService_1.sendOrderStatusUpdate)(user.email, orderData, 'PAID');
                }
            });
            console.log(`✅ Orden ${order_reference} marcada como PAID`);
        }
        else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
            await database_1.prisma.$transaction(async (tx) => {
                // Obtener la orden antes de actualizar para ver su estado previo
                const order = await tx.order.findUnique({
                    where: { id: order_reference },
                    include: { items: true },
                });
                if (!order || order.status === 'CANCELLED')
                    return;
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
    }
    catch (error) {
        console.error('Bold webhook error:', error);
        // Siempre responder 200 para que Bold no reintente
        return res.status(200).json({ received: true });
    }
};
exports.boldWebhookHandler = boldWebhookHandler;
