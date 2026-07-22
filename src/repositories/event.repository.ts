import { Types, UpdateQuery } from 'mongoose';
import { Event, IEvent } from '../models';
import { EventRsvpStatus } from '../types';

export class EventRepository {
  async create(data: Partial<IEvent>): Promise<IEvent> {
    const event = await Event.create(data);
    return event.populate('organizer', 'name email profileImage role department');
  }

  async findById(id: string): Promise<IEvent | null> {
    return Event.findById(id).populate(
      'organizer',
      'name email profileImage role department'
    );
  }

  async update(id: string, data: UpdateQuery<IEvent>): Promise<IEvent | null> {
    return Event.findByIdAndUpdate(id, data, { new: true }).populate(
      'organizer',
      'name email profileImage role department'
    );
  }

  async delete(id: string): Promise<IEvent | null> {
    return Event.findByIdAndDelete(id);
  }

  async findAll(
    page: number,
    limit: number,
    organizerId?: string,
    onlyApproved?: boolean,
    college?: string
  ): Promise<{ events: IEvent[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (organizerId) filter.organizer = organizerId;
    if (onlyApproved) filter.status = 'approved';
    if (college) filter.college = college;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name email profileImage role department')
        .skip(skip)
        .limit(limit)
        .sort({ eventDate: 1 }),
      Event.countDocuments(filter),
    ]);
    return { events, total };
  }

  async findRecent(limit: number, onlyApproved?: boolean, college?: string): Promise<IEvent[]> {
    const filter: Record<string, unknown> = {};
    if (onlyApproved) filter.status = 'approved';
    if (college) filter.college = college;

    return Event.find(filter)
      .populate('organizer', 'name email profileImage role department')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async rsvp(
    eventId: string,
    userId: string,
    status: EventRsvpStatus
  ): Promise<IEvent | null> {
    const event = await Event.findById(eventId);
    if (!event) return null;

    const existingIndex = event.rsvps.findIndex(
      (r) => r.user.toString() === userId
    );

    if (existingIndex >= 0) {
      const oldStatus = event.rsvps[existingIndex].status;
      if (oldStatus === status) return event;

      if (oldStatus === 'interested') event.interestedCount--;
      if (oldStatus === 'going') event.goingCount--;
      event.rsvps[existingIndex].status = status;
    } else {
      event.rsvps.push({ user: new Types.ObjectId(userId), status });
    }

    if (status === 'interested') event.interestedCount++;
    if (status === 'going') event.goingCount++;

    await event.save();
    return event.populate('organizer', 'name email profileImage role department');
  }

  async countDocuments(filter: Record<string, unknown> = {}): Promise<number> {
    return Event.countDocuments(filter);
  }
}

export const eventRepository = new EventRepository();
