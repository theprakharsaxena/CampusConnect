import { Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class CommentController {
  add = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comment = await commentService.addComment(
        getParam(req.params.postId),
        req.user!.userId,
        req.body.content
      );
      sendSuccess(res, comment, 'Comment added', 201);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await commentService.deleteComment(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'Comment deleted');
    } catch (error) {
      next(error);
    }
  };

  getByPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await commentService.getComments(getParam(req.params.postId), page, limit);
      sendSuccess(res, result.comments, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export const commentController = new CommentController();
