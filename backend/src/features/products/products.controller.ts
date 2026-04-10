import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { sendResponse } from '../../shared/utils/response';
import { env } from '../../config/env';

export class ProductController {
  
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
  static async getAll(req: Request, res: Response) {
    const result = await ProductService.getAll(req.query);
    sendResponse(res, 200, result.data, result.meta);
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
  static async getBySlug(req: Request, res: Response) {
    const result = await ProductService.getBySlug((req.params.slug as string));
    sendResponse(res, 200, result);
  }

  static async getById(req: Request, res: Response) {
    const result = await ProductService.getById((req.params.id as string));
    sendResponse(res, 200, result);
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
  static async create(req: Request, res: Response) {
    const result = await ProductService.create(req.body);
    sendResponse(res, 201, result);
  }

  static async update(req: Request, res: Response) {
    const result = await ProductService.update((req.params.id as string), req.body);
    sendResponse(res, 200, result);
  }

  static async delete(req: Request, res: Response) {
    await ProductService.delete((req.params.id as string));
    sendResponse(res, 200, { message: 'Product soft deleted' });
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
  static async uploadImages(req: Request, res: Response) {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return sendResponse(res, 400, { message: 'No files provided' });
    }

    const files = req.files as Express.Multer.File[];
    const baseUrl = env.FRONTEND_URL.replace('5173', '3001'); // Simple local url fallback if needed. In prod, map appropriately
    const hostUrl = req.protocol + '://' + req.get('host');
    
    const imagePaths = files.map((file) => `${hostUrl}/uploads/${file.filename}`);

    const product = await ProductService.addImages((req.params.id as string), imagePaths);
    sendResponse(res, 200, product);
  }

  static async removeImage(req: Request, res: Response) {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return sendResponse(res, 400, { message: 'ImageUrl is required' });
    }
    const product = await ProductService.removeImage((req.params.id as string), imageUrl);
    sendResponse(res, 200, product);
  }
}
