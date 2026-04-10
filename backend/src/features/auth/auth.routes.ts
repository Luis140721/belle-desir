import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import rateLimit from 'express-rate-limit';

export const authRoutes = Router();

// Strict rate limit for auth: 5 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many auth requests, please try again later.' }
});

authRoutes.post('/register', authLimiter, validate(registerSchema), asyncHandler(AuthController.register));
authRoutes.post('/login', authLimiter, validate(loginSchema), asyncHandler(AuthController.login));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(AuthController.refresh));
authRoutes.post('/logout', authenticate(), asyncHandler(AuthController.logout));
authRoutes.get('/me', authenticate(), asyncHandler(AuthController.getMe));
authRoutes.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(AuthController.forgotPassword));
authRoutes.post('/reset-password', validate(resetPasswordSchema), asyncHandler(AuthController.resetPassword));
