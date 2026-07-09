import { Post, IPost, Event, IEvent, Opportunity, IOpportunity } from '../models';
import { AppError, buildPagination } from '../utils/response';
import { ContentStatus } from '../models/Post.model';
import { sendPushToUser } from '../utils/firebase';
import { connectionRepository } from '../repositories/connection.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { userRepository } from '../repositories/user.repository';

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
    const updateData: any = {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    if (status === 'rejected') {
      updateData.$inc = { rejectionCount: 1 };
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
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

    // Send push notifications
    const authorId = type === 'post'
      ? (doc as IPost).author?._id?.toString()
      : type === 'event'
        ? (doc as IEvent).organizer?._id?.toString()
        : (doc as IOpportunity).postedBy?._id?.toString();

    if (authorId) {
      if (status === 'approved') {
        // Notify author their content is approved
        sendPushToUser(authorId, 'Content Approved', `Your ${type} has been approved and is now live!`, {
          type: 'content_approved',
          contentType: type,
          contentId: contentId,
        }).catch(() => {});

        // Notify author's connections about the new content
        this._notifyConnectionsOfApprovedContent(authorId, type, doc).catch(() => {});
      } else if (status === 'rejected') {
        sendPushToUser(authorId, 'Content Rejected', `Your ${type} was not approved.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`, {
          type: 'content_rejected',
          contentType: type,
          contentId: contentId,
        }).catch(() => {});
      }
    }

    return doc;
  }

  private async _notifyConnectionsOfApprovedContent(
    authorId: string,
    type: ContentType,
    doc: IPost | IEvent | IOpportunity
  ): Promise<void> {
    const author = await userRepository.findById(authorId);
    if (!author) return;
    const connectedIds = await connectionRepository.findConnectedUserIds(authorId);
    if (connectedIds.length === 0) return;

    const authorImage = author.profileImage || '';
    let message = '';

    if (type === 'post') {
      const post = doc as IPost;
      const preview = post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content;
      message = `Shared a new post: "${preview}"`;
    } else if (type === 'opportunity') {
      const opp = doc as IOpportunity;
      const company = opp.company ? ` at ${opp.company}` : '';
      const oppType = opp.type ? `[${opp.type}] ` : '';
      message = `Posted ${oppType}${opp.title}${company}`;
    } else if (type === 'event') {
      const event = doc as IEvent;
      const location = event.location ? ` at ${event.location}` : '';
      message = `Created an event: "${event.title}"${location}`;
    }

    for (const connId of connectedIds) {
      await notificationRepository.create({
        userId: connId,
        type: type === 'post' ? 'like' : type,
        title: author.name,
        message,
        referenceId: doc._id?.toString(),
        actorImage: authorImage,
      });
    }
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
