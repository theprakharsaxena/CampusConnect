import { Schema, model, Document } from 'mongoose';

export interface IVersionEntry {
  version: string;
  quickLogin: boolean;
}

export interface IVersionConfig extends Document {
  versions: IVersionEntry[];
}

const VersionEntrySchema = new Schema<IVersionEntry>(
  {
    version:    { type: String, required: true },
    quickLogin: { type: Boolean, required: true },
  },
  { _id: false }
);

const VersionConfigSchema = new Schema<IVersionConfig>(
  {
    versions: { type: [VersionEntrySchema], default: [] },
  },
  { timestamps: false }
);

// Singleton — only one config document ever exists
export const VersionConfig = model<IVersionConfig>('VersionConfig', VersionConfigSchema);
