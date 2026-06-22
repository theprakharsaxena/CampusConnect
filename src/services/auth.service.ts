import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { AppError } from '../utils/response';
import { EmailVerification, IUser } from '../models';
import { UserRole } from '../types';
import crypto from 'crypto';
import { config } from '../config';
import { sendVerificationEmail } from '../utils/mailer';
import { getDefaultIsActiveForRole } from '../utils/permissions';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
  batch?: string;
  rollNumber?: string;
}

interface LoginResult {
  user: Partial<IUser>;
  accessToken: string;
  refreshToken: string;
}

const sanitizeUser = (user: IUser): Partial<IUser> => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

export class AuthService {
  async sendEmailVerificationCode(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const code = this.generateVerificationCode();
    const codeHash = this.hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + config.emailVerification.expiresInMs);

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      { codeHash, expiresAt, verifiedAt: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendVerificationEmail(normalizedEmail, code);
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const record = await EmailVerification.findOne({ email: normalizedEmail }).select(
      '+codeHash'
    );

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new AppError('Verification code is invalid or expired', 400);
    }

    if (record.codeHash !== this.hashVerificationCode(code)) {
      throw new AppError('Verification code is invalid or expired', 400);
    }

    record.verifiedAt = new Date();
    await record.save();
  }

  async register(input: RegisterInput): Promise<LoginResult> {
    const normalizedEmail = input.email.toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const verificationRecord = await EmailVerification.findOne({
      email: normalizedEmail,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() },
    });
    if (!verificationRecord) {
      throw new AppError(
        'Please verify your email before creating an account',
        400
      );
    }

    const role = input.role || 'student';
    const hashedPassword = await hashPassword(input.password);
    const user = await userRepository.create({
      ...input,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isVerified: true,
      isActive: getDefaultIsActiveForRole(role),
    });

    const tokens = this.generateTokens(user);
    await userRepository.update(user._id.toString(), {
      refreshToken: tokens.refreshToken,
    });
    await EmailVerification.deleteOne({ email: normalizedEmail });

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been blocked', 403);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    await userRepository.update(user._id.toString(), {
      refreshToken: tokens.refreshToken,
    });

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await userRepository.findByIdWithSecrets(decoded.userId);

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (user.isBlocked) {
        throw new AppError('Your account has been blocked', 403);
      }

      const tokens = this.generateTokens(user);
      await userRepository.update(user._id.toString(), {
        refreshToken: tokens.refreshToken,
      });

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    await userRepository.update(userId, { refreshToken: null });
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      // Don't reveal if email exists
      return { resetToken: '' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await userRepository.update(user._id.toString(), {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 3600000),
    });

    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const { User } = await import('../models');
    const userWithToken = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!userWithToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userWithToken._id.toString(), {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
  }

  async getCurrentUser(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return sanitizeUser(user);
  }

  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashVerificationCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

export const authService = new AuthService();
