import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { CreateReviewInput } from './reviews.schemas';
import { getPagination, getPagingData } from '../../shared/utils/pagination';

export class ReviewService {
  static async addReview(userId: string, productId: string, data: CreateReviewInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    // Verify if user bought this and it was delivered
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!orderItem) {
      throw new AppError('You must have purchased and received this product to review it', 403);
    }

    return prisma.review.upsert({
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

  static async getProductReviews(productId: string, query: any) {
    const { page, limit } = query;
    const { take, skip } = getPagination(page ? +page : 1, limit ? +limit : 10);

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where: { productId },
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    return { data: reviews, meta: getPagingData(total, page ? +page : 1, limit ? +limit : 10) };
  }
}
