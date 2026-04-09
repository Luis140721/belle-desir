import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt.utils';
import { AppError } from '../shared/errors/AppError';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided or invalid format', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};
