"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
const categories_controller_1 = require("./categories.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const categories_schemas_1 = require("./categories.schemas");
const asyncHandler_1 = require("../../shared/utils/asyncHandler");
exports.categoryRoutes = (0, express_1.Router)();
// Public
exports.categoryRoutes.get('/', (0, asyncHandler_1.asyncHandler)(categories_controller_1.CategoryController.getAll));
exports.categoryRoutes.get('/:slug', (0, asyncHandler_1.asyncHandler)(categories_controller_1.CategoryController.getBySlug));
// Admin only
exports.categoryRoutes.use((0, authenticate_1.authenticate)(), (0, authorize_1.authorize)('ADMIN'));
exports.categoryRoutes.post('/', (0, validate_1.validate)(categories_schemas_1.createCategorySchema), (0, asyncHandler_1.asyncHandler)(categories_controller_1.CategoryController.create));
exports.categoryRoutes.put('/:id', (0, validate_1.validate)(categories_schemas_1.updateCategorySchema), (0, asyncHandler_1.asyncHandler)(categories_controller_1.CategoryController.update));
exports.categoryRoutes.delete('/:id', (0, asyncHandler_1.asyncHandler)(categories_controller_1.CategoryController.delete));
