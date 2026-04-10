import { Router } from 'express';
import { ProductController } from './products.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createProductSchema, updateProductSchema } from './products.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { upload } from '../../middleware/uploadMiddleware';

export const productRoutes = Router();

// Public
productRoutes.get('/', asyncHandler(ProductController.getAll));
productRoutes.get('/id/:id', asyncHandler(ProductController.getById));
// We place /:slug after any static paths, but here there are no other GET routes
productRoutes.get('/:slug', asyncHandler(ProductController.getBySlug));

// Admin only
productRoutes.use(authenticate(), authorize('ADMIN'));

productRoutes.post('/', validate(createProductSchema), asyncHandler(ProductController.create));
productRoutes.put('/:id', validate(updateProductSchema), asyncHandler(ProductController.update));
productRoutes.delete('/:id', asyncHandler(ProductController.delete));

// Image upload/remove
productRoutes.post('/:id/images', upload.array('images', 5), asyncHandler(ProductController.uploadImages));
productRoutes.delete('/:id/images', asyncHandler(ProductController.removeImage));
