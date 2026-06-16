import { FilterQuery, UpdateQuery } from 'mongoose';
import { Post, IPost } from '../models';

export class PostRepository {
  async create(data: Partial<IPost>): Promise<IPost> {
    return Post.create(data);
  }

  async findById(id: string): Promise<IPost | null> {
    return Post.findById(id).populate('author', 'name email profileImage role department');
  }

  async update(id: string, data: UpdateQuery<IPost>): Promise<IPost | null> {
    return Post.findByIdAndUpdate(id, data, { new: true }).populate(
      'author',
      'name email profileImage role department'
    );
  }

  async delete(id: string): Promise<IPost | null> {
    return Post.findByIdAndDelete(id);
  }

  async findFeed(
    page: number,
    limit: number,
    sort: 'latest' | 'trending' = 'latest'
  ): Promise<{ posts: IPost[]; total: number }> {
    const skip = (page - 1) * limit;
    const sortField = sort === 'trending' ? '-likesCount' : '-createdAt';

    const [posts, total] = await Promise.all([
      Post.find()
        .populate('author', 'name email profileImage role department')
        .skip(skip)
        .limit(limit)
        .sort(sortField),
      Post.countDocuments(),
    ]);

    return { posts, total };
  }

  async findTrending(limit: number): Promise<IPost[]> {
    return Post.find()
      .populate('author', 'name email profileImage role department')
      .sort({ likesCount: -1, commentsCount: -1 })
      .limit(limit);
  }

  async likePost(postId: string, userId: string): Promise<IPost | null> {
    return Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } },
      { new: true }
    ).populate('author', 'name email profileImage role department');
  }

  async unlikePost(postId: string, userId: string): Promise<IPost | null> {
    const post = await Post.findById(postId);
    if (!post || !post.likedBy.some((id) => id.toString() === userId)) {
      return post.populate('author', 'name email profileImage role department');
    }
    return Post.findByIdAndUpdate(
      postId,
      { $pull: { likedBy: userId }, $inc: { likesCount: -1 } },
      { new: true }
    ).populate('author', 'name email profileImage role department');
  }

  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const post = await Post.findById(postId);
    return post?.likedBy.some((id) => id.toString() === userId) ?? false;
  }

  async incrementCommentsCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  }

  async decrementCommentsCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
  }

  async countDocuments(filter: FilterQuery<IPost> = {}): Promise<number> {
    return Post.countDocuments(filter);
  }
}

export const postRepository = new PostRepository();
