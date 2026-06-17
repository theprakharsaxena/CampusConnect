import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError, sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Multer errors (file too large, too many files, wrong type, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File too large. Maximum allowed size per image is 20 MB.', 413);
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      sendError(res, 'Too many files. Maximum 5 images per post.', 400);
    } else {
      sendError(res, `Upload error: ${err.message}`, 400);
    }
    return;
  }

  // Cloudinary / upload errors
  const maybeHttp = err as { http_code?: number; message?: string };
  if (maybeHttp.http_code !== undefined) {
    console.error('Cloudinary error:', err);
    sendError(res, 'Failed to upload image. Please try again.', 502);
    return;
  }

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
