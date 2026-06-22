import { Response, NextFunction } from 'express';
import { moderationService } from '../services/moderation.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

type ContentType = 'post' | 'event' | 'opportunity';

const validTypes = ['post', 'event', 'opportunity'];

export class ModerationController {
  /**
   * GET /moderation/pending/:type
   * Lists all pending content of a given type. Admin/HOD/Teacher only.
   */
  getPending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as ContentType;
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, message: 'Invalid type. Must be post, event, or opportunity.' });
        return;
      }

      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );

      const result = await moderationService.getPendingContent(type, page, limit);
      sendSuccess(res, result.items, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /moderation/:type/:id/approve
   */
  approve = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as ContentType;
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, message: 'Invalid type.' });
        return;
      }

      const doc = await moderationService.reviewContent(
        type,
        getParam(req.params.id),
        'approved',
        req.user!.userId
      );
      sendSuccess(res, doc, `${type} approved`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /moderation/:type/:id/reject
   */
  reject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as ContentType;
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, message: 'Invalid type.' });
        return;
      }

      const doc = await moderationService.reviewContent(
        type,
        getParam(req.params.id),
        'rejected',
        req.user!.userId,
        req.body.reason
      );
      sendSuccess(res, doc, `${type} rejected`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /moderation/my/:type
   * Lists current user's own content with status. Optionally filtered by ?status=
   */
  getMyContent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as ContentType;
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, message: 'Invalid type.' });
        return;
      }

      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;

      const result = await moderationService.getMyContent(
        type,
        req.user!.userId,
        page,
        limit,
        status
      );
      sendSuccess(res, result.items, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export const moderationController = new ModerationController();
