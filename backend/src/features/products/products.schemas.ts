import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    price: z.number().positive(),
    comparePrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative(),
    sku: z.string().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.number().int().positive(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Since data comes as multipart/form-data for image uploads sometimes or numbers as strings
// we'll need to parse them in the controller, but we can accept strings and coerece them if using Zod preprocess.
// For simplicity, we assume we receive application/json for creating/updating except when uploading images explicitly.

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
