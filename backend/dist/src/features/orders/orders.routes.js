"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const orders_controller_1 = require("./orders.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const orders_schemas_1 = require("./orders.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.orderRoutes = (0, express_1.Router)();
// ── POST /api/orders ─────────────────────────────────────────
// NO requiere JWT: acepta invitados y usuarios autenticados.
// authenticate se usa como middleware "suave" — si no hay token,
// req.user queda undefined y OrderService maneja el flujo guest.
exports.orderRoutes.post('/', (0, authenticate_1.authenticate)({ required: false }), // ← no lanza error si falta el token
(0, validate_1.validate)(orders_schemas_1.createOrderSchema), (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.createOrder));
// ── Rutas que SÍ requieren autenticación ─────────────────────
exports.orderRoutes.get('/', (0, authenticate_1.authenticate)(), (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.getUserOrders));
exports.orderRoutes.get('/:id', (0, authenticate_1.authenticate)(), (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.getOrderById));
exports.orderRoutes.patch('/:id/status', (0, authenticate_1.authenticate)(), (0, validate_1.validate)(orders_schemas_1.updateOrderStatusSchema), (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.updateOrderStatus));
