import { Schema, model, Document, Types } from 'mongoose';

export interface IConversationDeletedFor {
  userId: Types.ObjectId;
  deletedAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  deletedFor: IConversationDeletedFor[];
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
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        deletedAt: { type: Date, required: true, default: Date.now },
      },
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
