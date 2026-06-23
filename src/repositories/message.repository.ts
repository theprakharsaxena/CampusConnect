import { Conversation, IConversation } from '../models';
import { Message, IMessage } from '../models';
import { Types } from 'mongoose';

export class ConversationRepository {
  async create(participants: string[]): Promise<IConversation> {
    const conversation = await Conversation.create({ participants });
    return conversation.populate('participants', 'name email profileImage');
  }

  async findById(id: string): Promise<IConversation | null> {
    return Conversation.findById(id).populate(
      'participants',
      'name email profileImage'
    );
  }

  async findByParticipants(userId1: string, userId2: string): Promise<IConversation | null> {
    return Conversation.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
    }).populate('participants', 'name email profileImage');
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ conversations: IConversation[]; total: number }> {
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email profileImage')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const filtered = conversations.filter((c) => {
      const deletionEntry = c.deletedFor.find(
        (d) => d.userId.toString() === userId
      );
      if (!deletionEntry) return true;
      if (!c.lastMessageAt) return false;
      return c.lastMessageAt > deletionEntry.deletedAt;
    });

    const paginated = filtered.slice(skip, skip + limit);
    return { conversations: paginated, total: filtered.length };
  }

  async updateLastMessage(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: messageId,
      lastMessageAt: new Date(),
    });
  }

  async deleteById(id: string): Promise<void> {
    await Conversation.findByIdAndDelete(id);
  }
}

export class MessageRepository {
  async create(data: Partial<IMessage>): Promise<IMessage> {
    const message = await Message.create(data);
    return message.populate('sender', 'name email profileImage');
  }

  async findByConversationId(
    conversationId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ messages: IMessage[]; total: number }> {
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    const deletionEntry = conversation?.deletedFor?.find(
      (d) => d.userId.toString() === userId
    );

    const query: any = { conversationId };
    if (deletionEntry) {
      query.createdAt = { $gt: deletionEntry.deletedAt };
    }

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'name email profileImage')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Message.countDocuments(query),
    ]);
    return { messages, total };
  }

  async markAsSeen(conversationId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seen: false,
      },
      { 
        seen: true, 
        seenAt: new Date(),
        delivered: true,
        deliveredAt: new Date()
      }
    );
  }

  async markAsDelivered(conversationIds: string[], userId: string): Promise<void> {
    await Message.updateMany(
      {
        conversationId: { $in: conversationIds },
        sender: { $ne: userId },
        delivered: false,
      },
      { 
        delivered: true, 
        deliveredAt: new Date() 
      }
    );
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await Message.deleteMany({ conversationId });
  }

  async countUnseenByConversations(
    conversationIds: string[],
    userId: string,
    deletionsMap: Record<string, Date> = {}
  ): Promise<Record<string, number>> {
    const matchConditions: any[] = [];
    for (const cid of conversationIds) {
      const deletedAt = deletionsMap[cid];
      if (deletedAt) {
        matchConditions.push({
          conversationId: new Types.ObjectId(cid),
          createdAt: { $gt: deletedAt },
        });
      } else {
        matchConditions.push({
          conversationId: new Types.ObjectId(cid),
        });
      }
    }

    const results = await Message.aggregate([
      {
        $match: {
          $or: matchConditions,
          sender: { $ne: new Types.ObjectId(userId) },
          seen: false,
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r._id.toString()] = r.count;
    }
    return counts;
  }
}

export const conversationRepository = new ConversationRepository();
export const messageRepository = new MessageRepository();
