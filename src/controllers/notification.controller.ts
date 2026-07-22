import { Response, NextFunction } from 'express';
import { notificationService, feedService } from '../services/notification.service';
import { AuthRequest, FeedSort } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class NotificationController {
  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await notificationService.getNotifications(
        req.user!.userId,
        page,
        limit
      );
      sendSuccess(
        res,
        { notifications: result.notifications, unreadCount: result.unreadCount },
        undefined,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await notificationService.markAsRead(
        getParam(req.params.id),
        req.user!.userId
      );
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, undefined, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  };
}

export class FeedController {
  getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const sort = (req.query.sort as FeedSort) || 'latest';
      const result = await feedService.getFeed(page, limit, sort, req.user!.role, req.user!.college || 'Bareilly College');
      sendSuccess(res, result.feed, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
export const feedController = new FeedController();
