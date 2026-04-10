"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const products_service_1 = require("./products.service");
const response_1 = require("../../shared/utils/response");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
class ProductController {
    /**
     * @swagger
     * /products:
     *   get:
     *     summary: Get all products with filters
     *     tags: [Products]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: List of products paginated
     */
    static async getAll(req, res) {
        const result = await products_service_1.ProductService.getAll(req.query);
        (0, response_1.sendResponse)(res, 200, result.data, result.meta);
    }
    /**
     * @swagger
     * /products/{slug}:
     *   get:
     *     summary: Get product by slug
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: slug
     *         required: true
     *     responses:
     *       200:
     *         description: Product data
     */
    static async getBySlug(req, res) {
        const result = await products_service_1.ProductService.getBySlug(req.params.slug);
        (0, response_1.sendResponse)(res, 200, result);
    }
    static async getById(req, res) {
        const result = await products_service_1.ProductService.getById(req.params.id);
        (0, response_1.sendResponse)(res, 200, result);
    }
    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Create a new product (ADMIN)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Product created
     */
    static async create(req, res) {
        const result = await products_service_1.ProductService.create(req.body);
        (0, response_1.sendResponse)(res, 201, result);
    }
    static async update(req, res) {
        const result = await products_service_1.ProductService.update(req.params.id, req.body);
        (0, response_1.sendResponse)(res, 200, result);
    }
    static async delete(req, res) {
        await products_service_1.ProductService.delete(req.params.id);
        (0, response_1.sendResponse)(res, 200, { message: 'Product soft deleted' });
    }
    /**
     * @swagger
     * /products/{id}/images:
     *   post:
     *     summary: Upload images for a product (ADMIN)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Images uploaded
     */
    static async uploadImages(req, res) {
        if (!req.files || req.files.length === 0) {
            return (0, response_1.sendResponse)(res, 400, { message: 'No files provided' });
        }
        const files = req.files;
        // Cloudinary returns path (which contains the secure_url)
        const imageUrls = files.map((file) => file.path);
        const product = await products_service_1.ProductService.addImages(req.params.id, imageUrls);
        (0, response_1.sendResponse)(res, 200, product);
    }
    static async removeImage(req, res) {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return (0, response_1.sendResponse)(res, 400, { message: 'ImageUrl is required' });
        }
        // Extract public_id from Cloudinary URL to delete from Cloudinary
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
            try {
                await cloudinary_1.default.uploader.destroy(publicId);
            }
            catch (error) {
                console.error('Error deleting from Cloudinary:', error);
                // Continue with database removal even if Cloudinary deletion fails
            }
        }
        const product = await products_service_1.ProductService.removeImage(req.params.id, imageUrl);
        (0, response_1.sendResponse)(res, 200, product);
    }
}
exports.ProductController = ProductController;
