import { Request, Response, NextFunction } from 'express';
import { VersionConfig } from '../models';
import { sendSuccess } from '../utils/response';

export class AppVersionController {
  /**
   * GET /api/v1/app-version/config
   * Returns the full list of version entries with their quickLogin flags.
   * Response shape: { versions: [{ version, quickLogin }] }
   */
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await VersionConfig.findOne();
      sendSuccess(res, { versions: config?.versions ?? [] });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/app-version/config
   * Upserts the version config. Body: { versions: [{ version, quickLogin }] }
   * Developer-only route.
   */
  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { versions } = req.body as { versions: { version: string; quickLogin: boolean }[] };
      const config = await VersionConfig.findOneAndUpdate(
        {},
        { $set: { versions } },
        { upsert: true, new: true }
      );
      sendSuccess(res, { versions: config.versions }, 'Version config updated');
    } catch (error) {
      next(error);
    }
  };
}
