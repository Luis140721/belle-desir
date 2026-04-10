"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
class ProductService {
    static async getAll(query) {
        const { page, limit, category, search, minPrice, maxPrice, isFeatured, sortBy } = query;
        const { take, skip } = (0, pagination_1.getPagination)(page ? +page : 1, limit ? +limit : 10);
        const where = {
            isActive: true,
        };
        if (category) {
            where.category = { slug: category };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = Number(minPrice);
            if (maxPrice)
                where.price.lte = Number(maxPrice);
        }
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured === 'true';
        }
        let orderBy = { id: 'desc' };
        if (sortBy === 'price_asc')
            orderBy = { price: 'asc' };
        if (sortBy === 'price_desc')
            orderBy = { price: 'desc' };
        if (sortBy === 'newest')
            orderBy = { id: 'desc' };
        const [products, total] = await database_1.prisma.$transaction([
            database_1.prisma.product.findMany({
                where,
                take,
                skip,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    price: true,
                    comparePrice: true,
                    stock: true,
                    sku: true,
                    images: true,
                    isFeatured: true,
                    isActive: true,
                    categoryId: true,
                    category: { select: { name: true, slug: true } },
                },
            }),
            database_1.prisma.product.count({ where }),
        ]);
        // Add inStock field virtually
        const productsWithStock = products.map(product => ({
            ...product,
            inStock: product.stock > 0,
        }));
        return {
            data: productsWithStock,
            meta: (0, pagination_1.getPagingData)(total, page ? +page : 1, limit ? +limit : 10),
        };
    }
    static async getBySlug(slug) {
        const product = await database_1.prisma.product.findUnique({
            where: { slug, isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                comparePrice: true,
                stock: true,
                sku: true,
                images: true,
                isFeatured: true,
                isActive: true,
                categoryId: true,
                category: true,
                reviews: {
                    where: { isVerifiedPurchase: true },
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!product) {
            throw new AppError_1.AppError('Product not found', 404);
        }
        // Add inStock field virtually
        return {
            ...product,
            inStock: product.stock > 0,
        };
    }
    static async getById(id) {
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                reviews: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
        });
        if (!product)
            throw new AppError_1.AppError('Product not found', 404);
        // Calculate avg rating
        const avgRating = product.reviews.length > 0
            ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length
            : 0;
        return { ...product, avgRating };
    }
    static async create(data) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        // Check slug
        const exists = await database_1.prisma.product.findUnique({ where: { slug } });
        if (exists)
            throw new AppError_1.AppError('A product with a similar name already exists', 409);
        if (data.sku) {
            const skuExists = await database_1.prisma.product.findUnique({ where: { sku: data.sku } });
            if (skuExists)
                throw new AppError_1.AppError('SKU already exists', 409);
        }
        return database_1.prisma.product.create({
            data: {
                ...data,
                slug,
            },
        });
    }
    static async update(id, data) {
        return database_1.prisma.product.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        // Soft delete
        return database_1.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
    static async addImages(id, imagePaths) {
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new AppError_1.AppError('Product not found', 404);
        const newImages = [...product.images, ...imagePaths].slice(0, 5); // Max 5
        return database_1.prisma.product.update({
            where: { id },
            data: { images: newImages },
        });
    }
    static async removeImage(id, imageUrl) {
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new AppError_1.AppError('Product not found', 404);
        const newImages = product.images.filter((img) => img !== imageUrl);
        return database_1.prisma.product.update({
            where: { id },
            data: { images: newImages },
        });
    }
}
exports.ProductService = ProductService;
