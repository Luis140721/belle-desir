import { Router } from 'express';
import { ReviewController } from './reviews.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createReviewSchema } from './reviews.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const reviewRoutes = Router({ mergeParams: true }); // Important if mounted under products/:productId/reviews

reviewRoutes.get('/', asyncHandler(ReviewController.getProductReviews));
reviewRoutes.post('/', authenticate(), validate(createReviewSchema), asyncHandler(ReviewController.addReview));
