import { Schema, model, Document } from 'mongoose';

export interface IEmailVerification extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerification = model<IEmailVerification>(
  'EmailVerification',
  emailVerificationSchema
);
