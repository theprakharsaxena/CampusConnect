import { eventRepository } from '../repositories/event.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { connectionRepository } from '../repositories/connection.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError, buildPagination } from '../utils/response';
import { uploadToCloudinary } from '../utils/cloudinary';
import { IEvent } from '../models';
import { IUser } from '../models/User.model';
import { EventRsvpStatus, UserRole } from '../types';
import { canManageRole, isManagementRole } from '../utils/permissions';
import { ContentStatus } from '../models/Post.model';
import { checkPublicContent, checkPublicImage } from '../utils/moderation';

export class EventService {
  async create(
    organizerId: string,
    data: Partial<IEvent>,
    bannerBuffer?: Buffer,
    organizerRole: UserRole = 'student'
  ): Promise<IEvent> {
    await checkPublicContent(data.title);
    await checkPublicContent(data.description);
    await checkPublicContent(data.location);
    await checkPublicImage(bannerBuffer);

    const eventData = { ...data };

    if (bannerBuffer) {
      const { url } = await uploadToCloudinary(bannerBuffer, 'campusconnect/events');
      eventData.bannerImage = url;
    }

    const status: ContentStatus = isManagementRole(organizerRole) ? 'approved' : 'pending';

    const event = await eventRepository.create({
      ...eventData,
      organizer: organizerId as unknown as IEvent['organizer'],
      status,
    });

    // Notify connections when event is auto-approved
    if (status === 'approved') {
      this._notifyConnectionsOfNewEvent(organizerId, data).catch(() => {});
    }

    return event;
  }

  private async _notifyConnectionsOfNewEvent(
    userId: string,
    data: Partial<IEvent>
  ): Promise<void> {
    const author = await userRepository.findById(userId);
    if (!author) return;
    const connectedIds = await connectionRepository.findConnectedUserIds(userId);
    if (connectedIds.length === 0) return;

    const title = data.title || 'an event';
    const location = data.location ? ` at ${data.location}` : '';
    const date = data.eventDate
      ? ` on ${new Date(data.eventDate as unknown as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : '';
    const authorImage = author.profileImage || '';

    for (const connId of connectedIds) {
      await notificationRepository.create({
        userId: connId,
        type: 'event',
        title: author.name,
        message: `Created an event: "${title}"${location}${date}`,
        actorImage: authorImage,
      });
    }
  }

  async getById(id: string): Promise<IEvent> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<IEvent>,
    bannerBuffer?: Buffer,
    userRole?: UserRole
  ): Promise<IEvent> {
    await checkPublicContent(data.title);
    await checkPublicContent(data.description);
    await checkPublicContent(data.location);
    await checkPublicImage(bannerBuffer);

    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const organizer = event.organizer as IUser;
    const organizerId = organizer._id?.toString() || (event.organizer as unknown as string).toString();
    const isOrganizer = organizerId === userId;
    const canManage = userRole && organizer.role && canManageRole(userRole, organizer.role);

    if (!isOrganizer && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    if (isOrganizer && !isManagementRole(userRole || 'student') && (event.rejectionCount || 0) >= 3) {
      throw new AppError('You cannot edit this event as it has been rejected too many times', 400);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (bannerBuffer) {
      const { url } = await uploadToCloudinary(bannerBuffer, 'campusconnect/events');
      updateData.bannerImage = url;
    }

    // Students/alumni: any edit resets status to pending for re-review
    if (isOrganizer && !isManagementRole(userRole || 'student')) {
      updateData.status = 'pending';
      updateData.rejectionReason = null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }

    const updated = await eventRepository.update(id, updateData);
    if (!updated) throw new AppError('Event not found', 404);
    return updated;
  }

  async delete(id: string, userId: string, userRole?: UserRole): Promise<void> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const organizer = event.organizer as IUser;
    const organizerId = organizer._id?.toString() || (event.organizer as unknown as string).toString();
    const isOrganizer = organizerId === userId;
    const canManage = userRole && organizer.role && canManageRole(userRole, organizer.role);

    if (!isOrganizer && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    await eventRepository.delete(id);
  }

  async getAll(page: number, limit: number, organizerId?: string, _userRole?: UserRole) {
    // Events feed always shows only approved content
    const { events, total } = await eventRepository.findAll(page, limit, organizerId, true);
    return {
      events,
      pagination: buildPagination(page, limit, total),
    };
  }

  async rsvp(eventId: string, userId: string, status: EventRsvpStatus): Promise<IEvent> {
    const event = await eventRepository.rsvp(eventId, userId, status);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  }
}

export const eventService = new EventService();
