import { Post, IPost, Event, IEvent, Opportunity, IOpportunity } from '../models';
import { AppError, buildPagination } from '../utils/response';
import { ContentStatus } from '../models/Post.model';

type ContentType = 'post' | 'event' | 'opportunity';

export class ModerationService {
  /**
   * Get all pending content (posts, events, opportunities) for review.
   */
  async getPendingContent(type: ContentType, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { status: 'pending' };

    switch (type) {
      case 'post': {
        const [items, total] = await Promise.all([
          Post.find(filter)
            .populate('author', 'name email profileImage role department')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Post.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      case 'event': {
        const [items, total] = await Promise.all([
          Event.find(filter)
            .populate('organizer', 'name email profileImage role department')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Event.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      case 'opportunity': {
        const [items, total] = await Promise.all([
          Opportunity.find(filter)
            .populate('postedBy', 'name email profileImage role company')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Opportunity.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      default:
        throw new AppError('Invalid content type', 400);
    }
  }

  /**
   * Approve or reject a piece of content.
   */
  async reviewContent(
    type: ContentType,
    contentId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    rejectionReason?: string
  ) {
    const updateData: Record<string, unknown> = {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    let doc: IPost | IEvent | IOpportunity | null = null;

    switch (type) {
      case 'post':
        doc = await Post.findByIdAndUpdate(contentId, updateData, { new: true })
          .populate('author', 'name email profileImage role department')
          .populate('reviewedBy', 'name email role');
        break;
      case 'event':
        doc = await Event.findByIdAndUpdate(contentId, updateData, { new: true })
          .populate('organizer', 'name email profileImage role department')
          .populate('reviewedBy', 'name email role');
        break;
      case 'opportunity':
        doc = await Opportunity.findByIdAndUpdate(contentId, updateData, { new: true })
          .populate('postedBy', 'name email profileImage role company')
          .populate('reviewedBy', 'name email role');
        break;
      default:
        throw new AppError('Invalid content type', 400);
    }

    if (!doc) throw new AppError('Content not found', 404);
    return doc;
  }

  /**
   * Get current user's own content with status info.
   */
  async getMyContent(
    type: ContentType,
    userId: string,
    page: number,
    limit: number,
    status?: ContentStatus
  ) {
    const skip = (page - 1) * limit;

    switch (type) {
      case 'post': {
        const filter: Record<string, unknown> = { author: userId };
        if (status) filter.status = status;
        const [items, total] = await Promise.all([
          Post.find(filter)
            .populate('reviewedBy', 'name email role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Post.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      case 'event': {
        const filter: Record<string, unknown> = { organizer: userId };
        if (status) filter.status = status;
        const [items, total] = await Promise.all([
          Event.find(filter)
            .populate('reviewedBy', 'name email role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Event.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      case 'opportunity': {
        const filter: Record<string, unknown> = { postedBy: userId };
        if (status) filter.status = status;
        const [items, total] = await Promise.all([
          Opportunity.find(filter)
            .populate('reviewedBy', 'name email role')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Opportunity.countDocuments(filter),
        ]);
        return { items, pagination: buildPagination(page, limit, total) };
      }
      default:
        throw new AppError('Invalid content type', 400);
    }
  }
}

export const moderationService = new ModerationService();
