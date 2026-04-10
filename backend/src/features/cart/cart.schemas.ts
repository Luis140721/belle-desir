import { z } from 'zod';

export const cartItemSchema = z.object({
  body: z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().nonnegative(),
  }),
});

export type CartItemInput = z.infer<typeof cartItemSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
