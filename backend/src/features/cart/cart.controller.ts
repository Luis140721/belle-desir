import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { sendResponse } from '../../shared/utils/response';

export class CartController {
  
  /**
   * @swagger
   * /cart:
   *   get:
   *     summary: Get user cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart object with items
   */
  static async getCart(req: Request, res: Response) {
    const cart = await CartService.getCart(req.user!.id);
    sendResponse(res, 200, cart);
  }

  /**
   * @swagger
   * /cart/items:
   *   post:
   *     summary: Add item to cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: string
   *               quantity:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Updated cart
   */
  static async addItem(req: Request, res: Response) {
    const cart = await CartService.addItem(req.user!.id, req.body);
    sendResponse(res, 200, cart);
  }

  /**
   * @swagger
   * /cart/items/{productId}:
   *   put:
   *     summary: Update cart item quantity
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - quantity
   *             properties:
   *               quantity:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Updated cart
   */
  static async updateItem(req: Request, res: Response) {
    const cart = await CartService.updateItem(req.user!.id, (req.params.productId as string), req.body);
    sendResponse(res, 200, cart);
  }

  /**
   * @swagger
   * /cart:
   *   delete:
   *     summary: Clear cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart cleared
   */
  static async clearCart(req: Request, res: Response) {
    const result = await CartService.clearCart(req.user!.id);
    sendResponse(res, 200, result);
  }
}
