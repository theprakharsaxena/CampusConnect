import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { userRepository } from '../repositories/user.repository';

export const requireActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    if (!user.isActive) {
      sendError(
        res,
        'Your account is inactive. You can view content and edit your profile only until approved.',
        403
      );
      return;
    }

    next();
  } catch {
    sendError(res, 'Failed to verify account status', 500);
  }
};
