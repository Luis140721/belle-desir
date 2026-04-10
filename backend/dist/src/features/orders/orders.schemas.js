"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// ─── Ítem de carrito enviado desde el frontend ───────────────
const cartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().cuid(),
    quantity: zod_1.z.number().int().positive(),
});
// ─── Dirección de envío ──────────────────────────────────────
const shippingAddressSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    // Solo se recibe la dirección; ciudad y país son fijos
    address: zod_1.z.string().min(5),
});
// ─── Crear orden ─────────────────────────────────────────────
// Acepta pedidos autenticados (items viene del carrito DB)
// Y pedidos de invitado (items viene en el body)
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        shippingAddress: shippingAddressSchema,
        // Invitados envían los items en el body; usuarios autenticados
        // pueden enviarlos también (el servicio usa DB como fallback)
        items: zod_1.z.array(cartItemSchema).optional(),
        // Datos del comprador invitado
        guestEmail: zod_1.z.string().email().optional(),
        guestName: zod_1.z.string().optional(),
        guestPhone: zod_1.z.string().optional(),
    }),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.OrderStatus),
    }),
});
