import { Response, NextFunction } from 'express';
import { userService, developerService, userManagementService } from '../services/user.service';
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

export class UserManagementController {
  getManageableUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const isActive =
        req.query.isActive === 'true'
          ? true
          : req.query.isActive === 'false'
            ? false
            : undefined;
      const result = await userManagementService.getManageableUsers(
        req.user!.userId,
        page,
        limit,
        isActive
      );
      sendSuccess(res, result.users, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getPendingUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await userManagementService.getPendingUsers(
        req.user!.userId,
        page,
        limit
      );
      sendSuccess(res, result.users, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userManagementService.updateUser(
        req.user!.userId,
        getParam(req.params.id),
        req.body
      );
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userManagementService.deleteUser(req.user!.userId, getParam(req.params.id));
      sendSuccess(res, undefined, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userManagementService.activateUser(
        req.user!.userId,
        getParam(req.params.id)
      );
      sendSuccess(res, user, 'User activated successfully');
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userManagementService.deactivateUser(
        req.user!.userId,
        getParam(req.params.id)
      );
      sendSuccess(res, user, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  };

  promoteSemesters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userManagementService.promoteSemesters(req.user!.userId, req.body.userIds);
      sendSuccess(res, undefined, 'Semesters promoted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export class DeveloperController {
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await developerService.getAllUsers(page, limit);
      sendSuccess(res, result.users, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await developerService.blockUser(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, user, 'User blocked');
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await developerService.unblockUser(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, user, 'User unblocked');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await developerService.deleteUser(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'User deleted');
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await postService.deletePost(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'Post deleted');
    } catch (error) {
      next(error);
    }
  };

  deleteOpportunity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await opportunityService.delete(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'Opportunity deleted');
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await developerService.getAnalytics();
      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
export const userManagementController = new UserManagementController();
export const developerController = new DeveloperController();
