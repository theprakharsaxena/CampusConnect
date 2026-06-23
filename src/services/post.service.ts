import { postRepository } from '../repositories/post.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { uploadToCloudinary } from '../utils/cloudinary';
import { IPost } from '../models';
import { IUser } from '../models/User.model';
import { canManageRole, isManagementRole } from '../utils/permissions';
import { UserRole } from '../types';
import { ContentStatus } from '../models/Post.model';

export class PostService {
  async createPost(
    authorId: string,
    content: string,
    tags: string[] = [],
    imageBuffers: Buffer[] = [],
    authorRole: UserRole = 'student'
  ): Promise<IPost> {
    // Images arrive pre-compressed from the client (≤5 MB each).
    // Upload all images concurrently — no sequential waiting.
    const images = await Promise.all(
      imageBuffers.map(async (buffer) => {
        const { url } = await uploadToCloudinary(buffer, 'campusconnect/posts');
        return url;
      })
    );

    // Developer/HOD/Teacher posts are auto-approved; students/alumni go to review
    const status: ContentStatus = isManagementRole(authorRole) ? 'approved' : 'pending';

    return postRepository.create({
      author: authorId as unknown as IPost['author'],
      content,
      tags,
      images,
      status,
    });
  }

  async getPostById(postId: string): Promise<IPost> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404);
    return post;
  }


  async updatePost(
    postId: string,
    userId: string,
    content: string,
    tags?: string[],
    userRole?: UserRole,
    imageBuffers: Buffer[] = [],
    existingImages?: string[]
  ): Promise<IPost> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    const author = post.author as IUser;
    const authorId = author._id?.toString() || (post.author as unknown as string).toString();
    const isAuthor = authorId === userId;
    const canManage = userRole && author.role && canManageRole(userRole, author.role);

    if (!isAuthor && !canManage) {
      throw new AppError('Not authorized to update this post', 403);
    }

    let images = post.images;
    if (existingImages || imageBuffers.length > 0) {
      const newImages = await Promise.all(
        imageBuffers.map(async (buffer) => {
          const { url } = await uploadToCloudinary(buffer, 'campusconnect/posts');
          return url;
        })
      );
      images = [...(existingImages || []), ...newImages];
    }

    // Students/alumni: any edit resets status to pending for re-review
    const statusUpdate: Record<string, unknown> = {};
    if (isAuthor && !isManagementRole(userRole || 'student')) {
      statusUpdate.status = 'pending';
      statusUpdate.rejectionReason = null;
      statusUpdate.reviewedBy = null;
      statusUpdate.reviewedAt = null;
    }

    const updated = await postRepository.update(postId, {
      content,
      ...(tags && { tags }),
      images,
      ...statusUpdate,
    });
    if (!updated) throw new AppError('Post not found', 404);
    return updated;
  }

  async deletePost(postId: string, userId: string, userRole?: UserRole): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    const author = post.author as IUser;
    const authorId = author._id?.toString() || (post.author as unknown as string).toString();
    const isAuthor = authorId === userId;
    const canManage = userRole && author.role && canManageRole(userRole, author.role);

    if (!isAuthor && !canManage) {
      throw new AppError('Not authorized to delete this post', 403);
    }

    await postRepository.delete(postId);
  }

  async getFeed(page: number, limit: number, sort: 'latest' | 'trending' = 'latest', authorId?: string, _userRole?: UserRole) {
    // Feed always shows only approved content for all users.
    // Developer/HOD/Teacher use the Review Content screen to see pending items.
    const { posts, total } = await postRepository.findFeed(page, limit, sort, authorId, true);
    return {
      posts,
      pagination: buildPagination(page, limit, total),
    };
  }

  async getTrendingPosts(limit: number, _userRole?: UserRole) {
    return postRepository.findTrending(limit, true);
  }

  async likePost(postId: string, userId: string): Promise<IPost> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    const alreadyLiked = await postRepository.isLikedByUser(postId, userId);
    if (alreadyLiked) throw new AppError('Post already liked', 400);

    const updated = await postRepository.likePost(postId, userId);
    if (!updated) throw new AppError('Post not found', 404);

    const authorId = (post.author as IUser)._id?.toString() || (post.author as unknown as string).toString();
    if (authorId !== userId) {
      await notificationRepository.create({
        userId: authorId,
        type: 'like',
        title: 'New Like',
        message: 'Someone liked your post',
        referenceId: postId,
      });
    }

    return updated;
  }

  async unlikePost(postId: string, userId: string): Promise<IPost> {
    const updated = await postRepository.unlikePost(postId, userId);
    if (!updated) throw new AppError('Post not found', 404);
    return updated;
  }
}

export const postService = new PostService();
