"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class CategoryService {
    static async getAll() {
        return database_1.prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
    }
    static async getBySlug(slug) {
        const category = await database_1.prisma.category.findUnique({
            where: { slug }
        });
        if (!category)
            throw new AppError_1.AppError('Category not found', 404);
        return category;
    }
    static async create(data) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const exists = await database_1.prisma.category.findUnique({ where: { slug } });
        if (exists)
            throw new AppError_1.AppError('Category with similar name already exists', 409);
        return database_1.prisma.category.create({
            data: { ...data, slug }
        });
    }
    static async update(id, data) {
        return database_1.prisma.category.update({
            where: { id },
            data
        });
    }
    static async delete(id) {
        const category = await database_1.prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
        if (!category)
            throw new AppError_1.AppError('Category not found', 404);
        if (category._count.products > 0)
            throw new AppError_1.AppError('Cannot delete category with products', 400);
        return database_1.prisma.category.delete({ where: { id } });
    }
}
exports.CategoryService = CategoryService;
