import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class AuthController {
  sendVerificationCode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await authService.sendEmailVerificationCode(req.body.email);
      sendSuccess(res, undefined, 'Verification code sent to email');
    } catch (error) {
      next(error);
    }
  };

  verifyEmailCode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, code } = req.body;
      await authService.verifyEmailCode(email, code);
      sendSuccess(res, undefined, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  };

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, college } = req.body;
      const result = await authService.login(email, password, college);
      if (result.multipleColleges) {
        res.status(200).json({
          success: true,
          message: 'Multiple colleges registered',
          data: {
            multipleColleges: true,
            colleges: result.colleges,
          },
        });
        return;
      }
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fcmToken = req.body.fcmToken as string | undefined;
      await authService.logout(req.user!.userId, fcmToken);
      sendSuccess(res, undefined, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(
        res,
        undefined,
        'If the email exists, a password reset code has been sent'
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      sendSuccess(res, undefined, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, undefined, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  registerDevice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fcmToken } = req.body;
      if (!fcmToken) {
        sendSuccess(res, undefined, 'Token is required');
        return;
      }
      await authService.registerDeviceToken(req.user!.userId, fcmToken);
      sendSuccess(res, undefined, 'Device registered');
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
