import { Connection, IConnection } from '../models';
import { ConnectionStatus } from '../types';

export class ConnectionRepository {
  async create(data: Partial<IConnection>): Promise<IConnection> {
    const connection = await Connection.create(data);
    return connection.populate([
      { path: 'sender', select: 'name email profileImage role department' },
      { path: 'receiver', select: 'name email profileImage role department' },
    ]);
  }

  async findById(id: string): Promise<IConnection | null> {
    return Connection.findById(id).populate([
      { path: 'sender', select: 'name email profileImage role department' },
      { path: 'receiver', select: 'name email profileImage role department' },
    ]);
  }

  async findBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<IConnection | null> {
    return Connection.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    });
  }

  async updateStatus(
    id: string,
    status: ConnectionStatus
  ): Promise<IConnection | null> {
    return Connection.findByIdAndUpdate(id, { status }, { new: true }).populate([
      { path: 'sender', select: 'name email profileImage role department' },
      { path: 'receiver', select: 'name email profileImage role department' },
    ]);
  }

  async delete(id: string): Promise<IConnection | null> {
    return Connection.findByIdAndDelete(id);
  }

  async findConnections(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ connections: IConnection[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = {
      status: 'accepted' as ConnectionStatus,
      $or: [{ sender: userId }, { receiver: userId }],
    };

    const [connections, total] = await Promise.all([
      Connection.find(filter)
        .populate('sender', 'name email profileImage role department')
        .populate('receiver', 'name email profileImage role department')
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 }),
      Connection.countDocuments(filter),
    ]);

    return { connections, total };
  }

  async findPendingRequests(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ requests: IConnection[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { receiver: userId, status: 'pending' as ConnectionStatus };

    const [requests, total] = await Promise.all([
      Connection.find(filter)
        .populate('sender', 'name email profileImage role department')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Connection.countDocuments(filter),
    ]);

    return { requests, total };
  }
  async findStatusBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<IConnection | null> {
    return Connection.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
      status: { $in: ['pending', 'accepted'] },
    }).populate([
      { path: 'sender', select: 'name email profileImage role department' },
      { path: 'receiver', select: 'name email profileImage role department' },
    ]);
  }

  /**
   * Returns all user IDs that are connected (accepted) with the given user.
   */
  async findConnectedUserIds(userId: string): Promise<string[]> {
    const connections = await Connection.find({
      status: 'accepted' as ConnectionStatus,
      $or: [{ sender: userId }, { receiver: userId }],
    }).select('sender receiver');

    return connections.map((c) => {
      const senderId = c.sender.toString();
      const receiverId = c.receiver.toString();
      return senderId === userId ? receiverId : senderId;
    });
  }
}

export const connectionRepository = new ConnectionRepository();
