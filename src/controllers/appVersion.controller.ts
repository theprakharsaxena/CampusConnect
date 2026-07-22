import { Request, Response, NextFunction } from 'express';
import { AppVersion } from '../models';
import { sendSuccess } from '../utils/response';

export class AppVersionController {
  getLatest = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const latest = await AppVersion.findOne().sort({ createdAt: -1 });
      sendSuccess(res, latest || null);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await AppVersion.find().sort({ createdAt: -1 });
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { version, apkUrl, releaseNotes, isMandatory } = req.body;
      
      const newVersion = await AppVersion.create({
        version,
        apkUrl,
        releaseNotes: releaseNotes || [],
        isMandatory: isMandatory || false,
      });

      sendSuccess(res, newVersion, 'Version published successfully', 201);
    } catch (error) {
      next(error);
    }
  };
}
