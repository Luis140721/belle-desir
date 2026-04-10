"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        description: zod_1.z.string().min(10),
        price: zod_1.z.number().positive(),
        comparePrice: zod_1.z.number().positive().optional(),
        stock: zod_1.z.number().int().nonnegative(),
        sku: zod_1.z.string().optional(),
        isFeatured: zod_1.z.boolean().optional(),
        categoryId: zod_1.z.number().int().positive(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(10).optional(),
        price: zod_1.z.number().positive().optional(),
        comparePrice: zod_1.z.number().positive().optional(),
        stock: zod_1.z.number().int().nonnegative().optional(),
        sku: zod_1.z.string().optional(),
        isFeatured: zod_1.z.boolean().optional(),
        categoryId: zod_1.z.number().int().positive().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
