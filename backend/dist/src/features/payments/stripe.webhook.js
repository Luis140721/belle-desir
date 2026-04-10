"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripe_1 = require("../../config/stripe");
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        // req.body here must be the raw buffer, provided by express.raw() in app.ts
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, env_1.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error(`⚠️ Stripe Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orderId = session.client_reference_id;
                if (orderId) {
                    await completeOrder(orderId, session.payment_intent);
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                // In this flow, we don't have client_reference_id directly on PI easily linked unless passed via metadata,
                // but session holds it. If failed, we can try to find order by stripeSessionId or PaymentIntent if mapped.
                // For simplicity, we search by paymentIntent if we stored it, or we rely on session events.
                // Actually checkout.session.async_payment_failed could be used, or we just find the order by session.
                // But Stripe Checkout usually creates PI only after success or redirects.
                const order = await database_1.prisma.order.findFirst({ where: { stripePaymentIntentId: paymentIntent.id } });
                if (order) {
                    await database_1.prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'CANCELLED' }
                    });
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }
    catch (error) {
        console.error(`Error processing webhook event:`, error);
        // Don't return 500 so Stripe doesn't retry infinitely if it's our DB bug, or do, depending on preference.
        // Usually we log and return 200 so it stops. If it's network we might want 500.
    }
    // Responde 200 inmediatamente para todos los eventos (exigido por Stripe)
    res.status(200).json({ received: true });
};
exports.handleStripeWebhook = handleStripeWebhook;
async function completeOrder(orderId, paymentIntentId) {
    await database_1.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!order || order.status !== 'PENDING')
            return;
        await tx.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                stripePaymentIntentId: paymentIntentId,
            },
        });
        // Reduce stock
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            });
        }
    });
}
