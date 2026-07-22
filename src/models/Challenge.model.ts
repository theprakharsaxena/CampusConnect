import { Schema, model, Document, Types } from 'mongoose';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type DSATopic =
  | 'arrays'
  | 'strings'
  | 'linked-lists'
  | 'stacks-queues'
  | 'trees'
  | 'graphs'
  | 'dynamic-programming'
  | 'sorting'
  | 'searching'
  | 'recursion'
  | 'hashing'
  | 'greedy'
  | 'bit-manipulation'
  | 'math';

export interface IOption {
  label: string;  // A, B, C, D
  text: string;
}

export interface IChallengeSubmission {
  userId: Types.ObjectId;
  selectedOption: string;   // A, B, C, or D
  isCorrect: boolean;
  submittedAt: Date;
}

export interface IChallenge extends Document {
  _id: Types.ObjectId;
  date: string;             // YYYY-MM-DD — one challenge per day
  topic: DSATopic;
  difficulty: DifficultyLevel;
  title: string;
  question: string;
  code?: string;            // Optional code snippet
  options: IOption[];
  correctOption: string;    // A, B, C, or D
  explanation: string;      // Why the correct answer is right
  submissions: IChallengeSubmission[];
  totalAttempts: number;
  totalCorrect: number;
  college: string;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    label: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const submissionSchema = new Schema<IChallengeSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    selectedOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const challengeSchema = new Schema<IChallenge>(
  {
    date: { type: String, required: true, index: true },
    topic: {
      type: String,
      enum: [
        'arrays', 'strings', 'linked-lists', 'stacks-queues',
        'trees', 'graphs', 'dynamic-programming', 'sorting',
        'searching', 'recursion', 'hashing', 'greedy',
        'bit-manipulation', 'math',
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    question: { type: String, required: true },
    code: { type: String },
    options: { type: [optionSchema], required: true },
    correctOption: { type: String, required: true },
    explanation: { type: String, required: true },
    submissions: [submissionSchema],
    totalAttempts: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    college: { type: String, default: 'Bareilly College', required: true },
  },
  { timestamps: true }
);

challengeSchema.index({ date: 1, college: 1 }, { unique: true });
challengeSchema.index({ college: 1 });

export const Challenge = model<IChallenge>('Challenge', challengeSchema);
