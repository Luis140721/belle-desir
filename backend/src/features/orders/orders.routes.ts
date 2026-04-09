import { Router } from 'express';
import { OrderController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const orderRoutes = Router();

orderRoutes.use(authenticate);

// User routes
orderRoutes.post('/', validate(createOrderSchema), asyncHandler(OrderController.createOrder));
orderRoutes.get('/', asyncHandler(OrderController.getUserOrders));
orderRoutes.get('/:id', asyncHandler(OrderController.getOrderById));

// Admin routes (would also traditionally be under /admin/orders but keeping it here for cohesion, accessible on same router)
// Wait, the plan says: GET /api/admin/orders, PATCH /api/admin/orders/:id/status
// We'll export these to be attached in admin.routes later or configure it here
