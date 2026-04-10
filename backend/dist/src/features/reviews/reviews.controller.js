"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const reviews_service_1 = require("./reviews.service");
const response_1 = require("../../shared/utils/response");
class ReviewController {
    static async addReview(req, res) {
        const result = await reviews_service_1.ReviewService.addReview(req.user.id, req.params.productId, req.body);
        (0, response_1.sendResponse)(res, 201, result);
    }
    static async getProductReviews(req, res) {
        const result = await reviews_service_1.ReviewService.getProductReviews(req.params.productId, req.query);
        (0, response_1.sendResponse)(res, 200, result.data, result.meta);
    }
}
exports.ReviewController = ReviewController;
