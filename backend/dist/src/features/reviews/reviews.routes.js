"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const express_1 = require("express");
const reviews_controller_1 = require("./reviews.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const reviews_schemas_1 = require("./reviews.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.reviewRoutes = (0, express_1.Router)({ mergeParams: true }); // Important if mounted under products/:productId/reviews
exports.reviewRoutes.get('/', (0, asyncHandler_1.asyncHandler)(reviews_controller_1.ReviewController.getProductReviews));
exports.reviewRoutes.post('/', (0, authenticate_1.authenticate)(), (0, validate_1.validate)(reviews_schemas_1.createReviewSchema), (0, asyncHandler_1.asyncHandler)(reviews_controller_1.ReviewController.addReview));
