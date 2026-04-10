"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
const express_1 = require("express");
const cart_controller_1 = require("./cart.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const cart_schemas_1 = require("./cart.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.cartRoutes = (0, express_1.Router)();
// All routes require authentication
exports.cartRoutes.use((0, authenticate_1.authenticate)());
exports.cartRoutes.get('/', (0, asyncHandler_1.asyncHandler)(cart_controller_1.CartController.getCart));
exports.cartRoutes.post('/items', (0, validate_1.validate)(cart_schemas_1.cartItemSchema), (0, asyncHandler_1.asyncHandler)(cart_controller_1.CartController.addItem));
exports.cartRoutes.put('/items/:productId', (0, validate_1.validate)(cart_schemas_1.updateCartItemSchema), (0, asyncHandler_1.asyncHandler)(cart_controller_1.CartController.updateItem));
exports.cartRoutes.delete('/items/:productId', (0, validate_1.validate)(cart_schemas_1.updateCartItemSchema), (0, asyncHandler_1.asyncHandler)(cart_controller_1.CartController.updateItem)); // if quantity=0, service deletes it; or explicitly create delete route
exports.cartRoutes.delete('/', (0, asyncHandler_1.asyncHandler)(cart_controller_1.CartController.clearCart));
