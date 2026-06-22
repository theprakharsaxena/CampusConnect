import { postRepository } from '../repositories/post.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { uploadToCloudinary } from '../utils/cloudinary';
import { IPost } from '../models';
import { IUser } from '../models/User.model';
import { canManageRole } from '../utils/permissions';
import { UserRole } from '../types';

export class PostService {
  async createPost(
    authorId: string,
    content: string,
    tags: string[] = [],
    imageBuffers: Buffer[] = []
  ): Promise<IPost> {
    // Images arrive pre-compressed from the client (≤5 MB each).
    // Upload all images concurrently — no sequential waiting.
    const images = await Promise.all(
      imageBuffers.map(async (buffer) => {
        const { url } = await uploadToCloudinary(buffer, 'campusconnect/posts');
        return url;
      })
    );

    return postRepository.create({
      author: authorId as unknown as IPost['author'],
      content,
      tags,
      images,
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

    const updated = await postRepository.update(postId, {
      content,
      ...(tags && { tags }),
      images,
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

  async getFeed(page: number, limit: number, sort: 'latest' | 'trending' = 'latest', authorId?: string) {
    const { posts, total } = await postRepository.findFeed(page, limit, sort, authorId);
    return {
      posts,
      pagination: buildPagination(page, limit, total),
    };
  }

  async getTrendingPosts(limit: number) {
    return postRepository.findTrending(limit);
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
