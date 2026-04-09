import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

// ─── Ítem de carrito enviado desde el frontend ───────────────
const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
});

// ─── Dirección de envío ──────────────────────────────────────
const shippingAddressSchema = z.object({
  name:    z.string().min(2),
  email:   z.string().email().optional(),
  phone:   z.string().optional(),
  address: z.string().min(5),
  city:    z.string().min(2),
  country: z.string().min(2).default('Colombia'),
  zip:     z.string().optional().default(''),
});

// ─── Crear orden ─────────────────────────────────────────────
// Acepta pedidos autenticados (items viene del carrito DB)
// Y pedidos de invitado (items viene en el body)
export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    // Invitados envían los items en el body; usuarios autenticados
    // pueden enviarlos también (el servicio usa DB como fallback)
    items: z.array(cartItemSchema).optional(),
    // Datos del comprador invitado
    guestEmail: z.string().email().optional(),
    guestName:  z.string().optional(),
    guestPhone: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export type CreateOrderInput    = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
