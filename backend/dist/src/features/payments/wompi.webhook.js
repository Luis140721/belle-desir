"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWompiWebhook = void 0;
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const crypto_1 = __importDefault(require("crypto"));
const handleWompiWebhook = async (req, res) => {
    try {
        const { event, data, signature, timestamp } = req.body;
        if (!signature || !signature.checksum || !signature.properties) {
            return res.status(400).send('Invalid signature format');
        }
        // Wompi verification:
        // Concatenate the values of the fields specified in signature.properties
        let concatenatedString = '';
        for (const prop of signature.properties) {
            // Split property path (e.g. "transaction.id")
            const keys = prop.split('.');
            let value = data;
            for (const key of keys) {
                value = value[key];
            }
            concatenatedString += String(value);
        }
        // Add timestamp and the Events secret
        concatenatedString += String(timestamp) + env_1.env.WOMPI_EVENTS_SECRET;
        // Generate SHA256 checksum
        const generatedChecksum = crypto_1.default.createHash('sha256').update(concatenatedString).digest('hex');
        if (generatedChecksum !== signature.checksum) {
            console.error(`⚠️ Wompi Webhook signature verification failed.`);
            return res.status(400).send('Webhook Error: Invalid Webhook Signature');
        }
        // Handle the event
        if (event === 'transaction.updated') {
            const transaction = data.transaction;
            const orderId = transaction.reference; // Assuming we send order.id as reference
            const status = transaction.status; // APPROVED, DECLINED, ERROR, VOIDED
            if (orderId) {
                if (status === 'APPROVED') {
                    await completeOrder(orderId, transaction.id);
                }
                else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
                    await cancelOrder(orderId);
                }
            }
        }
        // Respond 200 to acknowledge receipt
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error(`Error processing webhook event:`, error);
        // Return 200 anyway so Wompi doesn't retry infinitely on a bug
        res.status(200).send('Webhook received but processing failed');
    }
};
exports.handleWompiWebhook = handleWompiWebhook;
async function completeOrder(orderId, transactionId) {
    try {
        await database_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
            if (!order || order.status !== 'PENDING')
                return;
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    stripePaymentIntentId: transactionId, // Reusing field or you'd rename it in schema later
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
    catch (error) {
        console.error('Error in completeOrder:', error);
    }
}
async function cancelOrder(orderId) {
    try {
        const order = await database_1.prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === 'PENDING') {
            await database_1.prisma.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
            });
        }
    }
    catch (error) {
        console.error('Error cancelling order:', error);
    }
}
