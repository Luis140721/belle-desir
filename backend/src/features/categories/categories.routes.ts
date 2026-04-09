import { Router } from 'express';
import { CategoryController } from './categories.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createCategorySchema, updateCategorySchema } from './categories.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const categoryRoutes = Router();

// Public
categoryRoutes.get('/', asyncHandler(CategoryController.getAll));
categoryRoutes.get('/:slug', asyncHandler(CategoryController.getBySlug));

// Admin only
categoryRoutes.use(authenticate, authorize('ADMIN'));

categoryRoutes.post('/', validate(createCategorySchema), asyncHandler(CategoryController.create));
categoryRoutes.put('/:id', validate(updateCategorySchema), asyncHandler(CategoryController.update));
categoryRoutes.delete('/:id', asyncHandler(CategoryController.delete));
