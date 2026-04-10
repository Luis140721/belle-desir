"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const orders_service_1 = require("./orders.service");
const response_1 = require("../../shared/utils/response");
class OrderController {
    /**
     * POST /api/orders
     * Acepta usuarios autenticados (req.user presente) e invitados (req.user ausente).
     */
    static async createOrder(req, res) {
        // req.user puede ser undefined si vino sin JWT (invitado)
        const userId = req.user?.id ?? null;
        console.log('[orders] createOrder request', {
            userId,
            hasAuthHeader: Boolean(req.headers.authorization),
            hasGuestEmail: Boolean(req.body?.guestEmail),
            itemsCount: Array.isArray(req.body?.items) ? req.body.items.length : 0,
            path: req.path,
        });
        const result = await orders_service_1.OrderService.createOrder(userId, req.body);
        (0, response_1.sendResponse)(res, 201, result);
    }
    static async getUserOrders(req, res) {
        const result = await orders_service_1.OrderService.getUserOrders(req.user.id, req.query);
        (0, response_1.sendResponse)(res, 200, result.data, result.meta);
    }
    static async getOrderById(req, res) {
        const result = await orders_service_1.OrderService.getOrderById(req.user.id, req.params.id, req.user.role);
        (0, response_1.sendResponse)(res, 200, result);
    }
    static async getAdminOrders(req, res) {
        const result = await orders_service_1.OrderService.getAdminOrders(req.query);
        (0, response_1.sendResponse)(res, 200, result.data, result.meta);
    }
    static async updateOrderStatus(req, res) {
        const result = await orders_service_1.OrderService.updateOrderStatus(req.params.id, req.body);
        (0, response_1.sendResponse)(res, 200, result);
    }
}
exports.OrderController = OrderController;
