import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { postRepository } from '../repositories/post.repository';
import { opportunityRepository } from '../repositories/opportunity.repository';
import { eventRepository } from '../repositories/event.repository';
import { FeedSort } from '../types';

export class NotificationService {
  async getNotifications(userId: string, page: number, limit: number) {
    const { notifications, total, unreadCount } =
      await notificationRepository.findByUserId(userId, page, limit);
    return {
      notifications,
      unreadCount,
      pagination: buildPagination(page, limit, total),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await notificationRepository.markAsRead(
      notificationId,
      userId
    );
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }
}

export class FeedService {
  async getFeed(page: number, limit: number, sort: FeedSort = 'latest') {
    const fetchLimit = limit * 3;

    const [postsResult, opportunities, events] = await Promise.all([
      postRepository.findFeed(1, fetchLimit, sort),
      opportunityRepository.findRecent(fetchLimit),
      eventRepository.findRecent(fetchLimit),
    ]);

    const feedItems = [
      ...postsResult.posts.map((post) => ({
        type: 'post' as const,
        data: post,
        sortDate: post.createdAt,
        trendingScore: post.likesCount + post.commentsCount,
      })),
      ...opportunities.map((opp) => ({
        type: 'opportunity' as const,
        data: opp,
        sortDate: opp.createdAt,
        trendingScore: 0,
      })),
      ...events.map((event) => ({
        type: 'event' as const,
        data: event,
        sortDate: event.createdAt,
        trendingScore: event.goingCount + event.interestedCount,
      })),
    ];

    if (sort === 'trending') {
      feedItems.sort((a, b) => b.trendingScore - a.trendingScore);
    } else {
      feedItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }

    const total = feedItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = feedItems.slice(skip, skip + limit);

    return {
      feed: paginatedItems.map(({ type, data }) => ({ type, data })),
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const notificationService = new NotificationService();
export const feedService = new FeedService();
