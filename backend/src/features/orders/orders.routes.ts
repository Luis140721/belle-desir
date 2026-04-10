import { Router } from 'express';
import { OrderController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const orderRoutes = Router();

// ── POST /api/orders ─────────────────────────────────────────
// NO requiere JWT: acepta invitados y usuarios autenticados.
// authenticate se usa como middleware "suave" — si no hay token,
// req.user queda undefined y OrderService maneja el flujo guest.
orderRoutes.post(
  '/',
  authenticate({ required: false }),   // ← no lanza error si falta el token
  validate(createOrderSchema),
  asyncHandler(OrderController.createOrder)
);

// ── Rutas que SÍ requieren autenticación ─────────────────────
orderRoutes.get(  '/',    authenticate(),                          asyncHandler(OrderController.getUserOrders));
orderRoutes.get(  '/:id', authenticate(),                          asyncHandler(OrderController.getOrderById));
orderRoutes.patch('/:id/status', authenticate(), validate(updateOrderStatusSchema), asyncHandler(OrderController.updateOrderStatus));
