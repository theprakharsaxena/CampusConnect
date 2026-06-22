import { Schema, model, Document, Types, PopulatedDoc } from 'mongoose';
import { EventRsvpStatus } from '../types';
import { IUser } from './User.model';
import { ContentStatus } from './Post.model';

export interface IEventRsvp {
  user: Types.ObjectId;
  status: EventRsvpStatus;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  bannerImage?: string;
  organizer: PopulatedDoc<IUser & Document>;
  rsvps: IEventRsvp[];
  interestedCount: number;
  goingCount: number;
  status: ContentStatus;
  reviewedBy?: PopulatedDoc<IUser & Document>;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventRsvpSchema = new Schema<IEventRsvp>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['interested', 'going'], required: true },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    bannerImage: { type: String },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rsvps: [eventRsvpSchema],
    interestedCount: { type: Number, default: 0 },
    goingCount: { type: Number, default: 0 },
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

eventSchema.index({ organizer: 1, eventDate: -1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ title: 'text', description: 'text', location: 'text' });

export const Event = model<IEvent>('Event', eventSchema);
