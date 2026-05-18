import { Router } from 'express';
import { OrderController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const orderRoutes = Router();

orderRoutes.get('/:id/payment-status', asyncHandler(OrderController.getPublicPaymentStatus));

// Buying requires an authenticated account.
orderRoutes.post(
  '/',
  authenticate(),
  validate(createOrderSchema),
  asyncHandler(OrderController.createOrder)
);

orderRoutes.get('/', authenticate(), asyncHandler(OrderController.getUserOrders));
orderRoutes.get('/:id', authenticate(), asyncHandler(OrderController.getOrderById));
orderRoutes.patch('/:id/status', authenticate(), validate(updateOrderStatusSchema), asyncHandler(OrderController.updateOrderStatus));
