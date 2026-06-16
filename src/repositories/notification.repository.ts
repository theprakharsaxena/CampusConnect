import { Notification, INotification } from '../models';
import { NotificationType } from '../types';
import { Types } from 'mongoose';

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string;
  }): Promise<INotification> {
    return Notification.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
      ...(data.referenceId && { referenceId: new Types.ObjectId(data.referenceId) }),
    });
  }

  async createOrUpdateMessageNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId: string;
  }): Promise<INotification> {
    const existing = await Notification.findOne({
      userId: new Types.ObjectId(data.userId),
      type: 'message',
      referenceId: new Types.ObjectId(data.referenceId),
      isRead: false,
    });

    if (existing) {
      existing.message = data.message;
      existing.createdAt = new Date();
      existing.updatedAt = new Date();
      return existing.save();
    }

    return Notification.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
      referenceId: new Types.ObjectId(data.referenceId),
    });
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }
}

export const notificationRepository = new NotificationRepository();
