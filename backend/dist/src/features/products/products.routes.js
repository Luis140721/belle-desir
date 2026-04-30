"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
const multer_2 = __importDefault(require("multer"));
exports.productRoutes = (0, express_1.Router)();
// Public
exports.productRoutes.get('/', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getAll));
exports.productRoutes.get('/id/:id', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getById));
exports.productRoutes.get('/:slug', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.getBySlug));
// Admin only
exports.productRoutes.use((0, authenticate_1.authenticate)(), (0, authorize_1.authorize)('ADMIN'));
exports.productRoutes.post('/', (0, validate_1.validate)(products_schemas_1.createProductSchema), (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.create));
exports.productRoutes.put('/:id', (0, validate_1.validate)(products_schemas_1.updateProductSchema), (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.update));
exports.productRoutes.delete('/:id', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.delete));
// ── Image upload with explicit error handling ──
// Wrap multer to gracefully catch Cloudinary and upload errors.
const multerUpload = multer_1.upload.array('images', 5);
exports.productRoutes.post('/:id/images', (req, res, next) => {
    console.info('[ProductRoute] Initializing image upload for product:', req.params.id);
    multerUpload(req, res, function (err) {
        if (err instanceof multer_2.default.MulterError) {
            console.error('[Multer] ❌ Multer error during upload:', err.message);
            return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
        }
        else if (err) {
            console.error('[Cloudinary] ❌ Error during storage upload:', err.message, err);
            return res.status(500).json({ success: false, message: 'Storage provider error: ' + err.message });
        }
        // If no error, proceed to controller
        console.info('[ProductRoute] Multer upload successful, proceeding to controller.');
        next();
    });
}, (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.uploadImages));
exports.productRoutes.delete('/:id/images', (0, asyncHandler_1.asyncHandler)(products_controller_1.ProductController.removeImage));
