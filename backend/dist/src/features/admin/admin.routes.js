"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const orders_controller_1 = require("../orders/orders.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const orders_schemas_1 = require("../orders/orders.schemas");
exports.adminRoutes = (0, express_1.Router)();
exports.adminRoutes.use((0, authenticate_1.authenticate)(), (0, authorize_1.authorize)('ADMIN'));
exports.adminRoutes.get('/stats', (0, asyncHandler_1.asyncHandler)(admin_controller_1.AdminController.getStats));
// Orders management for admin
exports.adminRoutes.get('/orders', (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.getAdminOrders));
exports.adminRoutes.patch('/orders/:id/status', (0, validate_1.validate)(orders_schemas_1.updateOrderStatusSchema), (0, asyncHandler_1.asyncHandler)(orders_controller_1.OrderController.updateOrderStatus));
