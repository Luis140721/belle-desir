import { Response } from 'express';

export const sendResponse = <T>(res: Response, statusCode: number, data: T, meta?: any) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    data,
    ...(meta && { meta })
  });
};
