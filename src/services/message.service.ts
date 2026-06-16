import {
  conversationRepository,
  messageRepository,
} from '../repositories/message.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { IConversation, IMessage } from '../models';
import { isUserInConversationRoom, getIO } from '../sockets';

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

    // Get unseen message counts per conversation
    const conversationIds = conversations.map((c) => c._id.toString());
    const unreadCounts = conversationIds.length > 0
      ? await messageRepository.countUnseenByConversations(conversationIds, userId)
      : {};

    // Attach unread counts to each conversation
    const conversationsWithUnread = conversations.map((c) => {
      const conv = c.toObject();
      conv.unreadCount = unreadCounts[c._id.toString()] || 0;
      return conv;
    });

    return {
      conversations: conversationsWithUnread,
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

      // Always emit conversation_updated so the messages list screen refreshes
      try {
        const io = getIO();
        io.to(`user:${recipientId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: { text, sender: senderId },
        });
      } catch (_) {}

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
