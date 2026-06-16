import { Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';
import { getIO } from '../sockets';

export class MessageController {
  createConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversation = await messageService.createConversation(
        req.user!.userId,
        req.body.participantId
      );
      sendSuccess(res, conversation, 'Conversation created', 201);
    } catch (error) {
      next(error);
    }
  };

  getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await messageService.getConversations(req.user!.userId, page, limit);
      sendSuccess(res, result.conversations, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const convId = getParam(req.params.conversationId);
      const message = await messageService.sendMessage(
        convId,
        req.user!.userId,
        req.body.text,
        req.body.attachments
      );
      
      try {
        const io = getIO();
        io.to(`conversation:${convId}`).emit('new_message', message);
      } catch (error) {
        console.error('Failed to emit socket message:', error);
      }

      sendSuccess(res, message, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await messageService.getMessages(
        getParam(req.params.conversationId),
        req.user!.userId,
        page,
        limit
      );
      sendSuccess(res, result.messages, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await messageService.markAsRead(getParam(req.params.conversationId), req.user!.userId);
      sendSuccess(res, undefined, 'Messages marked as read');
    } catch (error) {
      next(error);
    }
  };
}

export const messageController = new MessageController();
