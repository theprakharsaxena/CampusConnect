import { Response, NextFunction } from 'express';
import { userService, adminService } from '../services/user.service';
import { postService } from '../services/post.service';
import { opportunityService } from '../services/opportunity.service';
import { UserRole, AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class UserController {
  getUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getUserById(getParam(req.params.id));
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const imageBuffer = req.file?.buffer;
      const user = await userService.updateProfile(
        req.user!.userId,
        req.body,
        imageBuffer
      );
      sendSuccess(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await userService.searchUsers({
        search: req.query.search as string,
        role: req.query.role as UserRole | undefined,
        department: req.query.department as string,
        batch: req.query.batch as string,
        skills: req.query.skills as string,
        page,
        limit,
      });
      sendSuccess(res, result.users, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export class AdminController {
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await adminService.getAllUsers(page, limit);
      sendSuccess(res, result.users, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await adminService.blockUser(getParam(req.params.id));
      sendSuccess(res, user, 'User blocked');
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await adminService.unblockUser(getParam(req.params.id));
      sendSuccess(res, user, 'User unblocked');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await adminService.deleteUser(getParam(req.params.id));
      sendSuccess(res, undefined, 'User deleted');
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await postService.deletePost(getParam(req.params.id), req.user!.userId, true);
      sendSuccess(res, undefined, 'Post deleted');
    } catch (error) {
      next(error);
    }
  };

  deleteOpportunity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await opportunityService.delete(getParam(req.params.id), req.user!.userId, true);
      sendSuccess(res, undefined, 'Opportunity deleted');
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await adminService.getAnalytics();
      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
export const adminController = new AdminController();
