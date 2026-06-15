import { Schema, model, Document, Types } from 'mongoose';
import { ConnectionStatus } from '../types';

export interface IConnection extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });
connectionSchema.index({ sender: 1, status: 1 });
connectionSchema.index({ receiver: 1, status: 1 });

export const Connection = model<IConnection>('Connection', connectionSchema);
