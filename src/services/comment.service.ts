import { commentRepository } from '../repositories/comment.repository';
import { postRepository } from '../repositories/post.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { IComment } from '../models';
import { IUser } from '../models/User.model';

export class CommentService {
  async addComment(
    postId: string,
    userId: string,
    content: string
  ): Promise<IComment> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    const comment = await commentRepository.create({
      postId: postId as unknown as IComment['postId'],
      userId: userId as unknown as IComment['userId'],
      content,
    });

    await postRepository.incrementCommentsCount(postId);

    const authorId = (post.author as IUser)._id?.toString() || (post.author as unknown as string).toString();
    if (authorId !== userId) {
      await notificationRepository.create({
        userId: authorId,
        type: 'comment',
        title: 'New Comment',
        message: 'Someone commented on your post',
        referenceId: postId,
      });
    }

    return comment;
  }

  async deleteComment(commentId: string, userId: string, isDeveloper = false): Promise<void> {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    const commentUserId = comment.userId._id?.toString() || comment.userId.toString();
    if (commentUserId !== userId && !isDeveloper) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await commentRepository.delete(commentId);
    await postRepository.decrementCommentsCount(comment.postId.toString());
  }

  async getComments(postId: string, page: number, limit: number) {
    const { comments, total } = await commentRepository.findByPostId(postId, page, limit);
    return {
      comments,
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const commentService = new CommentService();
