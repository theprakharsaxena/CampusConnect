import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  batch?: string;
  bio?: string;
  profileImage?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  company?: string;
  designation?: string;
  skills: string[];
  isVerified: boolean;
  isBlocked: boolean;
  refreshToken?: string;
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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'teacher', 'hod', 'alumni', 'admin'],
      default: 'student',
    },
    department: { type: String, trim: true },
    batch: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    profileImage: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ batch: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ name: 'text', email: 'text', bio: 'text' });

export const User = model<IUser>('User', userSchema);
