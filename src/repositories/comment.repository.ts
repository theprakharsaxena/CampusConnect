import { Comment, IComment } from '../models';

export class CommentRepository {
  async create(data: Partial<IComment>): Promise<IComment> {
    const comment = await Comment.create(data);
    return comment.populate('userId', 'name email profileImage role');
  }

  async findById(id: string): Promise<IComment | null> {
    return Comment.findById(id).populate('userId', 'name email profileImage role');
  }

  async delete(id: string): Promise<IComment | null> {
    return Comment.findByIdAndDelete(id);
  }

  async findByPostId(
    postId: string,
    page: number,
    limit: number
  ): Promise<{ comments: IComment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .populate('userId', 'name email profileImage role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ postId }),
    ]);
    return { comments, total };
  }
}

export const commentRepository = new CommentRepository();
