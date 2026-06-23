import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  sendVerificationCodeValidator,
  verifyEmailCodeValidator,
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators';

const router = Router();

router.post(
  '/send-verification-code',
  authRateLimiter,
  sendVerificationCodeValidator,
  validate,
  authController.sendVerificationCode
);
router.post(
  '/verify-email-code',
  authRateLimiter,
  verifyEmailCodeValidator,
  validate,
  authController.verifyEmailCode
);
router.post('/register', authRateLimiter, registerValidator, validate, authController.register);
router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

router.use(authenticate);

router.post('/logout', authController.logout);
router.post('/register-device', authController.registerDevice);
router.post('/change-password', changePasswordValidator, validate, authController.changePassword);
router.get('/me', authController.getCurrentUser);

export default router;
