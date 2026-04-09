import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt.utils';
import { AppError } from '../shared/errors/AppError';

interface AuthOptions {
  /** Si es false, el middleware no lanza error cuando falta el token.
   *  req.user quedará undefined y el controlador decide qué hacer. */
  required?: boolean;
}

/**
 * Middleware de autenticación flexible.
 *
 * Uso obligatorio (por defecto):  authenticate()
 * Uso opcional (guest allowed):   authenticate({ required: false })
 */
export const authenticate = (options: AuthOptions = { required: true }) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (options.required === false) {
        // Sin token y no requerido → continúa sin req.user
        return next();
      }
      return next(new AppError('No token provided or invalid format', 401));
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch {
      if (options.required === false) {
        // Token inválido y no requerido → continúa sin req.user
        return next();
      }
      return next(new AppError('Invalid or expired token', 401));
    }
  };
