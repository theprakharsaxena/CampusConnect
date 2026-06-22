import { Schema, model, Document, Types, PopulatedDoc } from 'mongoose';
import { IUser } from './User.model';

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: PopulatedDoc<IUser & Document>;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  likedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    images: [{ type: String }],
    tags: [{ type: String, trim: true, lowercase: true }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: 'text', tags: 'text' });

export const Post = model<IPost>('Post', postSchema);
