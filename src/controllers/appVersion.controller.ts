import { Request, Response, NextFunction } from 'express';
import { enabledQuickLoginVersions } from '../config/quickLoginVersions';
import { sendSuccess } from '../utils/response';

export class AppVersionController {
  /**
   * GET /api/v1/app-version/config
   * Returns the configuration list of versions where Quick Login is enabled.
   * Response: { enabledVersions: ["1.0.0"] }
   */
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, { enabledVersions: enabledQuickLoginVersions });
    } catch (error) {
      next(error);
    }
  };
}
