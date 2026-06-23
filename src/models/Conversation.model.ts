import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  deletedFor: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    deletedFor: [
      { type: Schema.Types.ObjectId, ref: 'User', default: [] },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = model<IConversation>(
  'Conversation',
  conversationSchema
);
