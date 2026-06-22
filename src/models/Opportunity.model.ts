import { Schema, model, Document, Types, PopulatedDoc } from 'mongoose';
import { OpportunityType } from '../types';
import { IUser } from './User.model';
import { ContentStatus } from './Post.model';

export interface IOpportunity extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  company: string;
  type: OpportunityType;
  skills: string[];
  applyLink?: string;
  deadline?: Date;
  postedBy: PopulatedDoc<IUser & Document>;
  status: ContentStatus;
  reviewedBy?: PopulatedDoc<IUser & Document>;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const opportunitySchema = new Schema<IOpportunity>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['internship', 'job', 'referral', 'hackathon', 'event'],
      required: true,
    },
    skills: [{ type: String, trim: true }],
    applyLink: { type: String },
    deadline: { type: Date },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

opportunitySchema.index({ postedBy: 1, createdAt: -1 });
opportunitySchema.index({ type: 1 });
opportunitySchema.index({ company: 1 });
opportunitySchema.index({ skills: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index({ status: 1, createdAt: -1 });
opportunitySchema.index({ title: 'text', description: 'text', company: 'text' });

export const Opportunity = model<IOpportunity>('Opportunity', opportunitySchema);
