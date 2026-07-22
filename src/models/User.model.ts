import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  college: string;
  department?: string;
  batch?: string;
  bio?: string;
  profileImage?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  company?: string;
  designation?: string;
  rollNumber?: string;
  semester?: number;
  skills: string[];
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  refreshToken?: string;
  fcmTokens: string[];
  streak: number;
  longestStreak: number;
  lastChallengeDate?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'teacher', 'hod', 'alumni', 'developer'],
      default: 'student',
    },
    college: {
      type: String,
      enum: ['Bareilly College', 'Test College'],
      default: 'Bareilly College',
      required: true,
    },
    department: { type: String, trim: true },
    batch: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    profileImage: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    semester: { type: Number },
    skills: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    fcmTokens: [{ type: String }],
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastChallengeDate: { type: String },  // YYYY-MM-DD
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, college: 1 }, { unique: true });
userSchema.index({ college: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ department: 1 });
userSchema.index({ batch: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ name: 'text', email: 'text', bio: 'text' });

export const User = model<IUser>('User', userSchema);

User.on('index', (err) => {
  if (err) console.error('Mongoose Index Error:', err);
  User.collection.dropIndex('email_1').catch(() => {});
});
