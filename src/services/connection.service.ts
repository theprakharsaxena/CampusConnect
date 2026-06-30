import { connectionRepository } from '../repositories/connection.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError, buildPagination } from '../utils/response';
import { IConnection } from '../models';

export class ConnectionService {
  async sendRequest(senderId: string, receiverId: string): Promise<IConnection> {
    if (senderId === receiverId) {
      throw new AppError('Cannot connect with yourself', 400);
    }

    const existing = await connectionRepository.findBetweenUsers(senderId, receiverId);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new AppError('Already connected', 400);
      }
      if (existing.status === 'pending') {
        throw new AppError('Connection request already pending', 400);
      }
      if (existing.status === 'rejected') {
        return connectionRepository.updateStatus(existing._id.toString(), 'pending') as Promise<IConnection>;
      }
    }

    const connection = await connectionRepository.create({
      sender: senderId as unknown as IConnection['sender'],
      receiver: receiverId as unknown as IConnection['receiver'],
      status: 'pending',
    });

    const senderName = (connection.sender as any).name || 'Someone';
    const senderImage = (connection.sender as any).profileImage || '';
    await notificationRepository.create({
      userId: receiverId,
      type: 'connection',
      title: senderName,
      message: 'Sent you a connection request',
      referenceId: connection._id.toString(),
      actorImage: senderImage,
    });

    return connection;
  }

  async acceptRequest(connectionId: string, userId: string): Promise<IConnection> {
    const connection = await connectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Connection request not found', 404);

    const receiverId = connection.receiver._id?.toString() || connection.receiver.toString();
    if (receiverId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    if (connection.status !== 'pending') {
      throw new AppError('Request is not pending', 400);
    }

    const updated = await connectionRepository.updateStatus(connectionId, 'accepted');
    if (!updated) throw new AppError('Connection request not found', 404);

    const senderId = connection.sender._id?.toString() || connection.sender.toString();
    const receiverName = (connection.receiver as any).name || 'Someone';
    const receiverImage = (connection.receiver as any).profileImage || '';
    await notificationRepository.create({
      userId: senderId,
      type: 'connection',
      title: receiverName,
      message: 'Accepted your connection request',
      referenceId: connectionId,
      actorImage: receiverImage,
    });

    return updated;
  }

  async rejectRequest(connectionId: string, userId: string): Promise<IConnection> {
    const connection = await connectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Connection request not found', 404);

    const receiverId = connection.receiver._id?.toString() || connection.receiver.toString();
    if (receiverId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const updated = await connectionRepository.updateStatus(connectionId, 'rejected');
    if (!updated) throw new AppError('Connection request not found', 404);
    return updated;
  }

  async cancelRequest(connectionId: string, userId: string): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Connection request not found', 404);

    const senderId = connection.sender._id?.toString() || connection.sender.toString();
    if (senderId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    if (connection.status !== 'pending') {
      throw new AppError('Can only cancel pending requests', 400);
    }

    await connectionRepository.delete(connectionId);
  }

  async removeConnection(connectionId: string, userId: string): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Connection not found', 404);

    const senderId = connection.sender._id?.toString() || connection.sender.toString();
    const receiverId = connection.receiver._id?.toString() || connection.receiver.toString();

    if (senderId !== userId && receiverId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    await connectionRepository.delete(connectionId);
  }

  async getConnections(userId: string, page: number, limit: number) {
    const { connections, total } = await connectionRepository.findConnections(
      userId,
      page,
      limit
    );
    return {
      connections,
      pagination: buildPagination(page, limit, total),
    };
  }

  async getConnectionStatus(userId: string, otherUserId: string): Promise<IConnection | null> {
    return connectionRepository.findStatusBetweenUsers(userId, otherUserId);
  }

  async getPendingRequests(userId: string, page: number, limit: number) {
    const { requests, total } = await connectionRepository.findPendingRequests(
      userId,
      page,
      limit
    );
    return {
      requests,
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const connectionService = new ConnectionService();
