"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const categories_service_1 = require("./categories.service");
const response_1 = require("../../shared/utils/response");
class CategoryController {
    /**
     * @swagger
     * /categories:
     *   get:
     *     summary: Get all categories
     *     tags: [Categories]
     *     responses:
     *       200:
     *         description: List of categories
     */
    static async getAll(req, res) {
        const categories = await categories_service_1.CategoryService.getAll();
        (0, response_1.sendResponse)(res, 200, categories);
    }
    /**
     * @swagger
     * /categories/{slug}:
     *   get:
     *     summary: Get a category by slug
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: slug
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Category object
     */
    static async getBySlug(req, res) {
        const category = await categories_service_1.CategoryService.getBySlug(req.params.slug);
        (0, response_1.sendResponse)(res, 200, category);
    }
    /**
     * @swagger
     * /categories:
     *   post:
     *     summary: Create a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Category created
     */
    static async create(req, res) {
        const category = await categories_service_1.CategoryService.create(req.body);
        (0, response_1.sendResponse)(res, 201, category);
    }
    /**
     * @swagger
     * /categories/{id}:
     *   put:
     *     summary: Update a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *     responses:
     *       200:
     *         description: Category updated
     */
    static async update(req, res) {
        const category = await categories_service_1.CategoryService.update(parseInt(req.params.id), req.body);
        (0, response_1.sendResponse)(res, 200, category);
    }
    /**
     * @swagger
     * /categories/{id}:
     *   delete:
     *     summary: Delete a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *     responses:
     *       200:
     *         description: Category deleted
     */
    static async delete(req, res) {
        await categories_service_1.CategoryService.delete(parseInt(req.params.id));
        (0, response_1.sendResponse)(res, 200, { message: 'Category deleted' });
    }
}
exports.CategoryController = CategoryController;
