import { eventRepository } from '../repositories/event.repository';
import { AppError, buildPagination } from '../utils/response';
import { uploadToCloudinary } from '../utils/cloudinary';
import { IEvent } from '../models';
import { EventRsvpStatus } from '../types';

export class EventService {
  async create(
    organizerId: string,
    data: Partial<IEvent>,
    bannerBuffer?: Buffer
  ): Promise<IEvent> {
    const eventData = { ...data };

    if (bannerBuffer) {
      const { url } = await uploadToCloudinary(bannerBuffer, 'campusconnect/events');
      eventData.bannerImage = url;
    }

    return eventRepository.create({
      ...eventData,
      organizer: organizerId as unknown as IEvent['organizer'],
    });
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
    isAdmin = false
  ): Promise<IEvent> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const organizerId = event.organizer._id?.toString() || event.organizer.toString();
    if (organizerId !== userId && !isAdmin) {
      throw new AppError('Not authorized', 403);
    }

    const updateData = { ...data };
    if (bannerBuffer) {
      const { url } = await uploadToCloudinary(bannerBuffer, 'campusconnect/events');
      updateData.bannerImage = url;
    }

    const updated = await eventRepository.update(id, updateData);
    if (!updated) throw new AppError('Event not found', 404);
    return updated;
  }

  async delete(id: string, userId: string, isAdmin = false): Promise<void> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const organizerId = event.organizer._id?.toString() || event.organizer.toString();
    if (organizerId !== userId && !isAdmin) {
      throw new AppError('Not authorized', 403);
    }

    await eventRepository.delete(id);
  }

  async getAll(page: number, limit: number, organizerId?: string) {
    const { events, total } = await eventRepository.findAll(page, limit, organizerId);
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
