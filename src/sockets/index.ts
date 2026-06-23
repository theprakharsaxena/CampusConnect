import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { messageService } from "../services/message.service";
import { config } from "../config";
import { Conversation } from "../models/Conversation.model";
import { messageRepository } from "../repositories/message.repository";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  ioInstance = io;

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    onlineUsers.set(userId, socket.id);

    socket.join(`user:${userId}`);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    // Mark undelivered messages sent to this user as delivered
    try {
      const conversations = await Conversation.find({ participants: userId });
      const conversationIds = conversations.map((c) => c._id.toString());
      if (conversationIds.length > 0) {
        await messageRepository.markAsDelivered(conversationIds, userId);
        for (const cid of conversationIds) {
          io.to(`conversation:${cid}`).emit("messages_delivered", {
            conversationId: cid,
            deliveredTo: userId,
          });
        }
      }
    } catch (err) {
      console.error("Error marking messages as delivered on connect:", err);
    }

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      "send_message",
      async (data: {
        conversationId: string;
        text: string;
        attachments?: string[];
      }) => {
        try {
          const message = await messageService.sendMessage(
            data.conversationId,
            userId,
            data.text,
            data.attachments,
          );

          io.to(`conversation:${data.conversationId}`).emit(
            "new_message",
            message,
          );
        } catch (error) {
          socket.emit("error", {
            message:
              error instanceof Error ? error.message : "Failed to send message",
          });
        }
      },
    );

    socket.on("typing_start", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    socket.on("mark_read", async (conversationId: string) => {
      try {
        await messageService.markAsRead(conversationId, userId);
        io.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          readBy: userId,
        });
      } catch (error) {
        socket.emit("error", {
          message:
            error instanceof Error ? error.message : "Failed to mark as read",
        });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());

export const isUserInConversationRoom = (
  userId: string,
  conversationId: string,
): boolean => {
  if (!ioInstance) return false;
  const socketId = onlineUsers.get(userId);
  if (!socketId) return false;
  const room = ioInstance.sockets.adapter.rooms.get(
    `conversation:${conversationId}`,
  );
  return room ? room.has(socketId) : false;
};
