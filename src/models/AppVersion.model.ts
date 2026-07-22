import { Schema, model, Document } from 'mongoose';

export interface IAppVersion extends Document {
  version: string;
  apkUrl: string;
  releaseNotes: string[];
  isMandatory: boolean;
  createdAt: Date;
}

const AppVersionSchema = new Schema<IAppVersion>({
  version: { type: String, required: true, unique: true },
  apkUrl: { type: String, required: true },
  releaseNotes: [{ type: String }],
  isMandatory: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const AppVersion = model<IAppVersion>('AppVersion', AppVersionSchema);
