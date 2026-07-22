import {
  conversationRepository,
  messageRepository,
} from '../repositories/message.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { userRepository } from '../repositories/user.repository';
import { Types } from 'mongoose';
import { AppError, buildPagination } from '../utils/response';
import { IConversation, IMessage } from '../models';
import { isUserInConversationRoom, getIO, getOnlineUsers } from '../sockets';

export class MessageService {
  async createConversation(
    userId: string,
    participantId: string
  ): Promise<IConversation> {
    if (userId === participantId) {
      throw new AppError('Cannot create conversation with yourself', 400);
    }

    const user = await userRepository.findById(userId);
    const participant = await userRepository.findById(participantId);
    if (!user || !participant) {
      throw new AppError('User not found', 404);
    }

    if (user.college !== participant.college) {
      throw new AppError('Users must belong to the same college to converse', 403);
    }

    const existing = await conversationRepository.findByParticipants(
      userId,
      participantId
    );
    if (existing) return existing;

    return conversationRepository.create([userId, participantId], user.college);
  }

  async getConversations(userId: string, page: number, limit: number) {
    const { conversations, total } = await conversationRepository.findByUserId(
      userId,
      page,
      limit
    );

    // Get unseen message counts per conversation
    const conversationIds = conversations.map((c) => c._id.toString());
    
    // Mark these as delivered since the user is fetching their conversation list
    if (conversationIds.length > 0) {
      await messageRepository.markAsDelivered(conversationIds, userId);
      try {
        const io = getIO();
        for (const cid of conversationIds) {
          io.to(`conversation:${cid}`).emit('messages_delivered', {
            conversationId: cid,
            deliveredTo: userId,
          });
        }
      } catch (_) {}
    }

    const deletionsMap: Record<string, Date> = {};
    for (const c of conversations) {
      const entry = c.deletedFor?.find((d) => d.userId.toString() === userId);
      if (entry) {
        deletionsMap[c._id.toString()] = entry.deletedAt;
      }
    }

    const unreadCounts = conversationIds.length > 0
      ? await messageRepository.countUnseenByConversations(conversationIds, userId, deletionsMap)
      : {};

    // Attach unread counts to each conversation
    const conversationsWithUnread = conversations.map((c) => {
      const conv = c.toObject();
      conv.unreadCount = unreadCounts[c._id.toString()] || 0;
      
      const deletionEntry = c.deletedFor?.find((d) => d.userId.toString() === userId);
      if (deletionEntry && conv.lastMessage && conv.lastMessage.createdAt) {
        if (new Date(conv.lastMessage.createdAt) <= deletionEntry.deletedAt) {
          conv.lastMessage = null;
        }
      }
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

    const recipient = conversation.participants.find(
      (p) => (p._id?.toString() || p.toString()) !== senderId
    );
    
    let isOnline = false;
    let recipientId = '';
    let isRecipientInRoom = false;
    if (recipient) {
      recipientId = recipient._id?.toString() || recipient.toString();
      isOnline = getOnlineUsers().includes(recipientId);
      isRecipientInRoom = isUserInConversationRoom(recipientId, conversationId);
    }

    const message = await messageRepository.create({
      conversationId: conversationId as unknown as IMessage['conversationId'],
      sender: senderId as unknown as IMessage['sender'],
      text,
      attachments,
      delivered: isOnline || isRecipientInRoom,
      deliveredAt: (isOnline || isRecipientInRoom) ? new Date() : undefined,
      seen: isRecipientInRoom,
      seenAt: isRecipientInRoom ? new Date() : undefined,
    });

    await conversationRepository.updateLastMessage(conversationId, message._id.toString());

    if (recipient && recipientId) {
      // Always emit conversation_updated so the messages list screen refreshes
      try {
        const io = getIO();
        io.to(`user:${recipientId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: { text, sender: senderId },
        });
        io.to(`user:${senderId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: { text, sender: senderId },
        });
      } catch (_) {}

      // Skip notification if recipient is already viewing this conversation
      if (!isRecipientInRoom) {
        const senderParticipant = conversation.participants.find(
          (p) => (p._id?.toString() || p.toString()) === senderId
        );
        const senderName = (senderParticipant as any)?.name || 'Someone';
        const senderImage = (senderParticipant as any)?.profileImage || '';
        await notificationRepository.createOrUpdateMessageNotification({
          userId: recipientId,
          type: 'message',
          title: senderName,
          message: text.substring(0, 100),
          referenceId: conversationId,
          actorImage: senderImage,
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

    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit('messages_delivered', {
        conversationId,
        deliveredTo: userId,
      });
    } catch (_) {}

    const { messages, total } = await messageRepository.findByConversationId(
      conversationId,
      userId,
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

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);

    const isParticipant = conversation.participants.some(
      (p) => (p._id?.toString() || p.toString()) === userId
    );
    if (!isParticipant) {
      throw new AppError('Not a participant of this conversation', 403);
    }

    // Add/Update userId in deletedFor
    const index = conversation.deletedFor.findIndex(
      (d) => d.userId.toString() === userId
    );
    if (index !== -1) {
      conversation.deletedFor[index].deletedAt = new Date();
    } else {
      conversation.deletedFor.push({
        userId: new Types.ObjectId(userId) as any,
        deletedAt: new Date(),
      });
    }
    await conversation.save();

    // Check if all participants deleted the conversation
    const participantsStr = conversation.participants.map((p) => p._id?.toString() || p.toString());
    const updatedDeletedForStr = conversation.deletedFor.map((id) => id.userId.toString());
    const allDeleted = participantsStr.every((pId) => updatedDeletedForStr.includes(pId));

    if (allDeleted) {
      await messageRepository.deleteByConversationId(conversationId);
      await conversationRepository.deleteById(conversationId);
    }
  }
}

export const messageService = new MessageService();
