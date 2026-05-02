import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
});

const shippingAddressSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    // The authenticated user's database cart is the source of truth. Items are
    // accepted only as a fallback for older clients that send an authenticated cart.
    items: z.array(cartItemSchema).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
