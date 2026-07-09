import { commentRepository } from '../repositories/comment.repository';
import { postRepository } from '../repositories/post.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { IComment } from '../models';
import { IUser } from '../models/User.model';
import { UserRole } from '../types';
import { checkPublicContent } from '../utils/moderation';

export class CommentService {
  async addComment(
    postId: string,
    userId: string,
    content: string
  ): Promise<IComment> {
    await checkPublicContent(content);

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
      const commenterName = (comment.userId as any).name || 'Someone';
      const commenterImage = (comment.userId as any).profileImage || '';
      await notificationRepository.create({
        userId: authorId,
        type: 'comment',
        title: commenterName,
        message: 'Commented on your post',
        referenceId: postId,
        actorImage: commenterImage,
      });
    }

    return comment;
  }

  async deleteComment(commentId: string, userId: string, userRole: UserRole): Promise<void> {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    const commenter = comment.userId as unknown as IUser;
    const commentUserId = commenter._id?.toString() || (comment.userId as any).toString();
    const commenterRole = commenter.role || 'student';

    const isOwner = commentUserId === userId;

    if (isOwner) {
      await commentRepository.delete(commentId);
      await postRepository.decrementCommentsCount(comment.postId.toString());
      return;
    }

    if (userRole === 'developer') {
      await commentRepository.delete(commentId);
      await postRepository.decrementCommentsCount(comment.postId.toString());
      return;
    }

    if (userRole === 'hod') {
      if (commenterRole === 'developer') {
        throw new AppError('Not authorized to delete a developer\'s comment', 403);
      }
      await commentRepository.delete(commentId);
      await postRepository.decrementCommentsCount(comment.postId.toString());
      return;
    }

    if (userRole === 'teacher') {
      if (commenterRole === 'developer' || commenterRole === 'hod') {
        throw new AppError(`Not authorized to delete a ${commenterRole}'s comment`, 403);
      }
      await commentRepository.delete(commentId);
      await postRepository.decrementCommentsCount(comment.postId.toString());
      return;
    }

    throw new AppError('Not authorized to delete this comment', 403);
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
