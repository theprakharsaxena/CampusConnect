import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  mongodb: {
    uri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/campusconnect'),
  },
  jwt: {
    accessSecret: getEnv('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  cloudinary: {
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: getEnv('CLOUDINARY_API_KEY', ''),
    apiSecret: getEnv('CLOUDINARY_API_SECRET', ''),
  },
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  passwordReset: {
    expiresIn: parseInt(process.env.PASSWORD_RESET_EXPIRES_IN || '3600000', 10),
  },
} as const;
