import { Router } from 'express';
import { AdminController } from './admin.controller';
import { OrderController } from '../orders/orders.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { updateOrderStatusSchema } from '../orders/orders.schemas';

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize('ADMIN'));

adminRoutes.get('/stats', asyncHandler(AdminController.getStats));

// Orders management for admin
adminRoutes.get('/orders', asyncHandler(OrderController.getAdminOrders));
adminRoutes.patch('/orders/:id/status', validate(updateOrderStatusSchema), asyncHandler(OrderController.updateOrderStatus));
