import { Response, NextFunction } from 'express';
import { connectionService } from '../services/connection.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class ConnectionController {
  sendRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connection = await connectionService.sendRequest(
        req.user!.userId,
        req.body.receiverId
      );
      sendSuccess(res, connection, 'Connection request sent', 201);
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connection = await connectionService.acceptRequest(
        getParam(req.params.id),
        req.user!.userId
      );
      sendSuccess(res, connection, 'Connection accepted');
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connection = await connectionService.rejectRequest(
        getParam(req.params.id),
        req.user!.userId
      );
      sendSuccess(res, connection, 'Connection rejected');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await connectionService.cancelRequest(getParam(req.params.id), req.user!.userId);
      sendSuccess(res, undefined, 'Request cancelled');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await connectionService.removeConnection(getParam(req.params.id), req.user!.userId);
      sendSuccess(res, undefined, 'Connection removed');
    } catch (error) {
      next(error);
    }
  };

  getConnections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await connectionService.getConnections(req.user!.userId, page, limit);
      sendSuccess(res, result.connections, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const otherUserId = getParam(req.params.userId);
      const connection = await connectionService.getConnectionStatus(
        req.user!.userId,
        otherUserId
      );
      sendSuccess(res, connection);
    } catch (error) {
      next(error);
    }
  };

  getPending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await connectionService.getPendingRequests(req.user!.userId, page, limit);
      sendSuccess(res, result.requests, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export const connectionController = new ConnectionController();
