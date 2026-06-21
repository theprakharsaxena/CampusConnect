import { Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class PostController {
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = req.body.tags
        ? typeof req.body.tags === 'string'
          ? JSON.parse(req.body.tags)
          : req.body.tags
        : [];
      const imageBuffers = (req.files as Express.Multer.File[] | undefined)?.map(
        (f) => f.buffer
      ) || [];

      const post = await postService.createPost(
        req.user!.userId,
        req.body.content,
        tags,
        imageBuffers
      );
      sendSuccess(res, post, 'Post created', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.getPostById(getParam(req.params.id));
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.updatePost(
        getParam(req.params.id),
        req.user!.userId,
        req.body.content,
        req.body.tags
      );
      sendSuccess(res, post, 'Post updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await postService.deletePost(getParam(req.params.id), req.user!.userId);
      sendSuccess(res, undefined, 'Post deleted');
    } catch (error) {
      next(error);
    }
  };

  getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const sort = (req.query.sort as 'latest' | 'trending') || 'latest';
      const authorId = req.query.authorId as string | undefined;
      const result = await postService.getFeed(page, limit, sort, authorId);
      sendSuccess(res, result.posts, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getTrending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await postService.getTrendingPosts(limit);
      sendSuccess(res, posts);
    } catch (error) {
      next(error);
    }
  };

  like = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.likePost(getParam(req.params.id), req.user!.userId);
      sendSuccess(res, post, 'Post liked');
    } catch (error) {
      next(error);
    }
  };

  unlike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.unlikePost(getParam(req.params.id), req.user!.userId);
      sendSuccess(res, post, 'Post unliked');
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();
