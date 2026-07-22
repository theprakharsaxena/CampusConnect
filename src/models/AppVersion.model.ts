import { Schema, model, Document } from 'mongoose';

export interface IVersionConfig extends Document {
  enabledVersions: string[];
}

const VersionConfigSchema = new Schema<IVersionConfig>(
  {
    enabledVersions: { type: [String], default: [] },
  },
  { timestamps: false }
);

// Singleton — only one config document ever exists
export const VersionConfig = model<IVersionConfig>('VersionConfig', VersionConfigSchema);
