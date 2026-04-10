"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const products_controller_1 = require("./products.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const products_schemas_1 = require("./products.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const multer_1 = require("../../config/multer");
exports.productRoutes = (0, express_1.Router)();
// Public
exports.productRoutes.get('/', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getAll));
exports.productRoutes.get('/id/:id', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getById));
// We place /:slug after any static paths, but here there are no other GET routes
exports.productRoutes.get('/:slug', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getBySlug));
// Admin only
exports.productRoutes.use((0, authenticate_1.authenticate)(), (0, authorize_1.authorize)('ADMIN'));
exports.productRoutes.post('/', (0, validate_1.validate)(products_schemas_1.createProductSchema), (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.create));
exports.productRoutes.put('/:id', (0, validate_1.validate)(products_schemas_1.updateProductSchema), (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.update));
exports.productRoutes.delete('/:id', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.delete));
// Image upload/remove
exports.productRoutes.post('/:id/images', multer_1.upload.array('images', 5), (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.uploadImages));
exports.productRoutes.delete('/:id/images', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.removeImage));
