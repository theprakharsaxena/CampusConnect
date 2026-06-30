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
    actorImage?: string;
  }): Promise<INotification> {
    const notification = await Notification.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
      ...(data.referenceId && { referenceId: new Types.ObjectId(data.referenceId) }),
    });

    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      io.to(`user:${data.userId}`).emit('new_notification', notification);
    } catch (_) {}

    // Send push notification (lazy import, fire-and-forget)
    import('../utils/firebase').then(({ sendPushToUser }) => {
      sendPushToUser(data.userId, data.title, data.message, {
        type: data.type,
        referenceId: data.referenceId || '',
        ...(data.actorImage && { actorImage: data.actorImage }),
      }).catch(() => {});
    }).catch(() => {});

    return notification;
  }

  async createOrUpdateMessageNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId: string;
    actorImage?: string;
  }): Promise<INotification> {
    const existing = await Notification.findOne({
      userId: new Types.ObjectId(data.userId),
      type: 'message',
      referenceId: new Types.ObjectId(data.referenceId),
      isRead: false,
    });

    let notification: INotification;
    if (existing) {
      existing.message = data.message;
      existing.createdAt = new Date();
      existing.updatedAt = new Date();
      notification = await existing.save();
    } else {
      notification = await Notification.create({
        ...data,
        userId: new Types.ObjectId(data.userId),
        referenceId: new Types.ObjectId(data.referenceId),
      });
    }

    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      io.to(`user:${data.userId}`).emit('new_notification', notification);
    } catch (_) {}

    // Send push notification (lazy import, fire-and-forget)
    import('../utils/firebase').then(({ sendPushToUser }) => {
      sendPushToUser(data.userId, data.title, data.message, {
        type: 'message',
        referenceId: data.referenceId,
        ...(data.actorImage && { actorImage: data.actorImage }),
      }).catch(() => {});
    }).catch(() => {});

    return notification;
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
