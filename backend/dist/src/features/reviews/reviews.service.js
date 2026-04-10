"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
class ReviewService {
    static async addReview(userId, productId, data) {
        const product = await database_1.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new AppError_1.AppError('Product not found', 404);
        // Verify if user bought this and it was delivered
        const orderItem = await database_1.prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId,
                    status: 'DELIVERED',
                },
            },
        });
        if (!orderItem) {
            throw new AppError_1.AppError('You must have purchased and received this product to review it', 403);
        }
        return database_1.prisma.review.upsert({
            where: {
                userId_productId: { userId, productId },
            },
            update: {
                rating: data.rating,
                comment: data.comment,
                isVerifiedPurchase: true,
            },
            create: {
                userId,
                productId,
                rating: data.rating,
                comment: data.comment,
                isVerifiedPurchase: true,
            },
        });
    }
    static async getProductReviews(productId, query) {
        const { page, limit } = query;
        const { take, skip } = (0, pagination_1.getPagination)(page ? +page : 1, limit ? +limit : 10);
        const [reviews, total] = await database_1.prisma.$transaction([
            database_1.prisma.review.findMany({
                where: { productId },
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } },
            }),
            database_1.prisma.review.count({ where: { productId } }),
        ]);
        return { data: reviews, meta: (0, pagination_1.getPagingData)(total, page ? +page : 1, limit ? +limit : 10) };
    }
}
exports.ReviewService = ReviewService;
