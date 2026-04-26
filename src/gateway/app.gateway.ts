import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default_secret_change_me',
      });

      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      client.emit('authenticated', { userId: payload.sub });
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`Client disconnected: ${client.id} (user: ${client.userId})`);
    }
  }

  // --- Client → Server: Rooms beitreten ---

  @SubscribeMessage('join-channel')
  handleJoinChannel(client: AuthenticatedSocket, data: { channelId: string }) {
    client.join(`channel:${data.channelId}`);
  }

  @SubscribeMessage('leave-channel')
  handleLeaveChannel(client: AuthenticatedSocket, data: { channelId: string }) {
    client.leave(`channel:${data.channelId}`);
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(client: AuthenticatedSocket, data: { chatId: string }) {
    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(client: AuthenticatedSocket, data: { chatId: string }) {
    client.leave(`chat:${data.chatId}`);
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(client: AuthenticatedSocket, data: { channelId?: string; chatId?: string }) {
    const payload = { userId: client.userId };
    if (data.channelId) {
      client.to(`channel:${data.channelId}`).emit('typing-start', payload);
    } else if (data.chatId) {
      client.to(`chat:${data.chatId}`).emit('typing-start', payload);
    }
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(client: AuthenticatedSocket, data: { channelId?: string; chatId?: string }) {
    const payload = { userId: client.userId };
    if (data.channelId) {
      client.to(`channel:${data.channelId}`).emit('typing-stop', payload);
    } else if (data.chatId) {
      client.to(`chat:${data.chatId}`).emit('typing-stop', payload);
    }
  }

  // --- Server → Client Broadcast-Helfer (von Services aufgerufen) ---

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  broadcastToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  broadcastToChat(chatId: string, event: string, data: any) {
    this.server.to(`chat:${chatId}`).emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastUserStatus(userId: string, online: boolean) {
    this.server.emit(online ? 'user:online' : 'user:offline', { userId });
  }
}
