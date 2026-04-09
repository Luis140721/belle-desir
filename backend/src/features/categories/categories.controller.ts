import { Request, Response } from 'express';
import { CategoryService } from './categories.service';
import { sendResponse } from '../../shared/utils/response';

export class CategoryController {
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
  static async getAll(req: Request, res: Response) {
    const categories = await CategoryService.getAll();
    sendResponse(res, 200, categories);
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
  static async getBySlug(req: Request, res: Response) {
    const category = await CategoryService.getBySlug((req.params.slug as string));
    sendResponse(res, 200, category);
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
  static async create(req: Request, res: Response) {
    const category = await CategoryService.create(req.body);
    sendResponse(res, 201, category);
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
  static async update(req: Request, res: Response) {
    const category = await CategoryService.update(parseInt((req.params.id as string)), req.body);
    sendResponse(res, 200, category);
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
  static async delete(req: Request, res: Response) {
    await CategoryService.delete(parseInt((req.params.id as string)));
    sendResponse(res, 200, { message: 'Category deleted' });
  }
}
