import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { AppError } from '../utils/response';
import { User, EmailVerification, IUser } from '../models';
import { UserRole } from '../types';
import crypto from 'crypto';
import { config } from '../config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { getDefaultIsActiveForRole } from '../utils/permissions';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  college?: string;
  department?: string;
  batch?: string;
  rollNumber?: string;
  semester?: number;
}

interface LoginResult {
  user?: Partial<IUser>;
  accessToken?: string;
  refreshToken?: string;
  multipleColleges?: boolean;
  colleges?: string[];
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
    const existing = await User.findOne({ email: normalizedEmail, college: input.college });
    if (existing) {
      throw new AppError('An account with this email is already registered in this college', 409);
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

  async login(email: string, password: string, college?: string): Promise<LoginResult> {
    const users = await User.find({ email: email.toLowerCase() }).select(
      '+password +refreshToken +passwordResetToken +passwordResetExpires'
    );

    if (users.length === 0) {
      throw new AppError('This email is not registered', 404);
    }

    let user: IUser;
    if (users.length > 1 && !college) {
      return {
        multipleColleges: true,
        colleges: users.map((u: any) => u.college),
      };
    } else if (college) {
      const matched = users.find((u: any) => u.college === college);
      if (!matched) {
        throw new AppError('This email is not registered in the selected college', 404);
      }
      user = matched;
    } else {
      user = users[0];
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been blocked. Please contact administration.', 403);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError('Incorrect password. Please check and try again.', 401);
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

  async logout(userId: string, fcmToken?: string): Promise<void> {
    const updateData: Record<string, unknown> = { refreshToken: null };
    await userRepository.update(userId, updateData);

    // Remove the device's FCM token so this user stops receiving pushes on this device
    if (fcmToken) {
      const { User } = await import('../models');
      await User.updateOne(
        { _id: userId },
        { $pull: { fcmTokens: fcmToken } }
      );
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError('No account found with this email address', 404);
    }

    // Generate a 6-digit reset code and send it to the user's email
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(resetCode).digest('hex');

    await userRepository.update(user._id.toString(), {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await sendPasswordResetEmail(email, resetCode);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const { User } = await import('../models');
    const userWithToken = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!userWithToken) {
      throw new AppError('Invalid or expired reset code', 400);
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

  async registerDeviceToken(userId: string, fcmToken: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Remove this token from any OTHER user who had it (device switched accounts)
    const { User } = await import('../models');
    await User.updateMany(
      { _id: { $ne: userId }, fcmTokens: fcmToken },
      { $pull: { fcmTokens: fcmToken } }
    );

    // Add token if not already present (avoid duplicates)
    const tokens = user.fcmTokens || [];
    if (!tokens.includes(fcmToken)) {
      tokens.push(fcmToken);
      // Keep only last 5 tokens (user may have multiple devices)
      const trimmed = tokens.slice(-5);
      await userRepository.update(userId, { fcmTokens: trimmed });
    }
  }

  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      college: user.college || 'Bareilly College',
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
