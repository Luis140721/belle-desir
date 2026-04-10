"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("./cart.service");
const response_1 = require("../../shared/utils/response");
class CartController {
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
    static async getCart(req, res) {
        const cart = await cart_service_1.CartService.getCart(req.user.id);
        (0, response_1.sendResponse)(res, 200, cart);
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
    static async addItem(req, res) {
        const cart = await cart_service_1.CartService.addItem(req.user.id, req.body);
        (0, response_1.sendResponse)(res, 200, cart);
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
    static async updateItem(req, res) {
        const cart = await cart_service_1.CartService.updateItem(req.user.id, req.params.productId, req.body);
        (0, response_1.sendResponse)(res, 200, cart);
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
    static async clearCart(req, res) {
        const result = await cart_service_1.CartService.clearCart(req.user.id);
        (0, response_1.sendResponse)(res, 200, result);
    }
}
exports.CartController = CartController;
