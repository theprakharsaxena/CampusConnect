import {
  conversationRepository,
  messageRepository,
} from '../repositories/message.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { IConversation, IMessage } from '../models';
import { isUserInConversationRoom } from '../sockets';

export class MessageService {
  async createConversation(
    userId: string,
    participantId: string
  ): Promise<IConversation> {
    if (userId === participantId) {
      throw new AppError('Cannot create conversation with yourself', 400);
    }

    const existing = await conversationRepository.findByParticipants(
      userId,
      participantId
    );
    if (existing) return existing;

    return conversationRepository.create([userId, participantId]);
  }

  async getConversations(userId: string, page: number, limit: number) {
    const { conversations, total } = await conversationRepository.findByUserId(
      userId,
      page,
      limit
    );
    return {
      conversations,
      pagination: buildPagination(page, limit, total),
    };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    attachments: string[] = []
  ): Promise<IMessage> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);

    const isParticipant = conversation.participants.some(
      (p) => (p._id?.toString() || p.toString()) === senderId
    );
    if (!isParticipant) {
      throw new AppError('Not a participant of this conversation', 403);
    }

    const message = await messageRepository.create({
      conversationId: conversationId as unknown as IMessage['conversationId'],
      sender: senderId as unknown as IMessage['sender'],
      text,
      attachments,
    });

    await conversationRepository.updateLastMessage(conversationId, message._id.toString());

    const recipient = conversation.participants.find(
      (p) => (p._id?.toString() || p.toString()) !== senderId
    );
    if (recipient) {
      const recipientId = recipient._id?.toString() || recipient.toString();

      // Skip notification if recipient is already viewing this conversation
      const isRecipientInRoom = isUserInConversationRoom(recipientId, conversationId);
      if (!isRecipientInRoom) {
        await notificationRepository.createOrUpdateMessageNotification({
          userId: recipientId,
          type: 'message',
          title: 'New Message',
          message: text.substring(0, 100),
          referenceId: conversationId,
        });
      }
    }

    return message;
  }

  async getMessages(conversationId: string, userId: string, page: number, limit: number) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);

    const isParticipant = conversation.participants.some(
      (p) => (p._id?.toString() || p.toString()) === userId
    );
    if (!isParticipant) {
      throw new AppError('Not a participant of this conversation', 403);
    }

    await messageRepository.markAsSeen(conversationId, userId);

    const { messages, total } = await messageRepository.findByConversationId(
      conversationId,
      page,
      limit
    );
    return {
      messages,
      pagination: buildPagination(page, limit, total),
    };
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);

    await messageRepository.markAsSeen(conversationId, userId);
  }
}

export const messageService = new MessageService();
