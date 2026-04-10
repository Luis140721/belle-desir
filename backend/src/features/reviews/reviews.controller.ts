import { Request, Response } from 'express';
import { ReviewService } from './reviews.service';
import { sendResponse } from '../../shared/utils/response';

export class ReviewController {
  static async addReview(req: Request, res: Response) {
    const result = await ReviewService.addReview(req.user!.id, (req.params.productId as string), req.body);
    sendResponse(res, 201, result);
  }

  static async getProductReviews(req: Request, res: Response) {
    const result = await ReviewService.getProductReviews((req.params.productId as string), req.query);
    sendResponse(res, 200, result.data, result.meta);
  }
}
