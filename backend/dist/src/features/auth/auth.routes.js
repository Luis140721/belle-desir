"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const auth_schemas_1 = require("./auth.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authRoutes = (0, express_1.Router)();
// Strict rate limit for auth: 5 attempts per 15 min per IP
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many auth requests, please try again later.' }
});
exports.authRoutes.post('/register', authLimiter, (0, validate_1.validate)(auth_schemas_1.registerSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.register));
exports.authRoutes.post('/login', authLimiter, (0, validate_1.validate)(auth_schemas_1.loginSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.login));
exports.authRoutes.post('/refresh', (0, validate_1.validate)(auth_schemas_1.refreshSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.refresh));
exports.authRoutes.post('/logout', (0, authenticate_1.authenticate)(), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.logout));
exports.authRoutes.get('/me', (0, authenticate_1.authenticate)(), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.getMe));
exports.authRoutes.post('/forgot-password', authLimiter, (0, validate_1.validate)(auth_schemas_1.forgotPasswordSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.forgotPassword));
exports.authRoutes.post('/reset-password', (0, validate_1.validate)(auth_schemas_1.resetPasswordSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.AuthController.resetPassword));
