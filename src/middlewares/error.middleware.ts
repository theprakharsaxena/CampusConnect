import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400);
    return;
  }

  if (err.name === 'CastError') {
    sendError(res, 'Invalid resource ID', 400);
    return;
  }

  if ((err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyValue?: object }).keyValue || {})[0];
    sendError(res, `${field} already exists`, 409);
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};
