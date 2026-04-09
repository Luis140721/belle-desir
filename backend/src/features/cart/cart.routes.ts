import { Router } from 'express';
import { CartController } from './cart.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { cartItemSchema, updateCartItemSchema } from './cart.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const cartRoutes = Router();

// All routes require authentication
cartRoutes.use(authenticate);

cartRoutes.get('/', asyncHandler(CartController.getCart));
cartRoutes.post('/items', validate(cartItemSchema), asyncHandler(CartController.addItem));
cartRoutes.put('/items/:productId', validate(updateCartItemSchema), asyncHandler(CartController.updateItem));
cartRoutes.delete('/items/:productId', validate(updateCartItemSchema), asyncHandler(CartController.updateItem)); // if quantity=0, service deletes it; or explicitly create delete route
cartRoutes.delete('/', asyncHandler(CartController.clearCart));
