import { Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { AuthRequest, EventRsvpStatus } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class EventController {
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await eventService.create(
        req.user!.userId,
        req.body,
        req.file?.buffer,
        req.user!.role
      );
      sendSuccess(res, event, 'Event created', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await eventService.getById(getParam(req.params.id));
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await eventService.update(
        getParam(req.params.id),
        req.user!.userId,
        req.body,
        req.file?.buffer,
        req.user!.role
      );
      sendSuccess(res, event, 'Event updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await eventService.delete(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'Event deleted');
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const organizerId = req.query.organizerId as string | undefined;
      const result = await eventService.getAll(page, limit, organizerId, req.user!.role);
      sendSuccess(res, result.events, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  rsvp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await eventService.rsvp(
        getParam(req.params.id),
        req.user!.userId,
        req.body.status as EventRsvpStatus
      );
      sendSuccess(res, event, 'RSVP updated');
    } catch (error) {
      next(error);
    }
  };
}

export const eventController = new EventController();
