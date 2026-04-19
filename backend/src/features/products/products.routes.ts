import { Router, Request, Response, NextFunction } from 'express';
import { ProductController } from './products.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { createProductSchema, updateProductSchema } from './products.schemas.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { upload } from '../../config/multer.js';
import multer from 'multer';

export const productRoutes = Router();

// Public
productRoutes.get('/', asyncHandler(ProductController.getAll));
productRoutes.get('/id/:id', asyncHandler(ProductController.getById));
productRoutes.get('/:slug', asyncHandler(ProductController.getBySlug));

// Admin only
productRoutes.use(authenticate(), authorize('ADMIN'));

productRoutes.post('/', validate(createProductSchema), asyncHandler(ProductController.create));
productRoutes.put('/:id', validate(updateProductSchema), asyncHandler(ProductController.update));
productRoutes.delete('/:id', asyncHandler(ProductController.delete));

// ── Image upload with explicit error handling ──
// Wrap multer to gracefully catch Cloudinary and upload errors.
const multerUpload = upload.array('images', 5);

productRoutes.post('/:id/images', (req: Request, res: Response, next: NextFunction) => {
  console.info('[ProductRoute] Initializing image upload for product:', req.params.id);
  
  multerUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('[Multer] ❌ Multer error during upload:', err.message);
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
      console.error('[Cloudinary] ❌ Error during storage upload:', err.message, err);
      return res.status(500).json({ success: false, message: 'Storage provider error: ' + err.message });
    }
    
    // If no error, proceed to controller
    console.info('[ProductRoute] Multer upload successful, proceeding to controller.');
    next();
  });
}, asyncHandler(ProductController.uploadImages));

productRoutes.delete('/:id/images', asyncHandler(ProductController.removeImage));
