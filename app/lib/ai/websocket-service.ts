
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import {
  RealtimeUpdate,
  WebSocketMessage,
  RealTimeNotificationItem
} from '../types';
import {
  NotificationType,
  NotificationSeverity
} from '@prisma/client';

interface WebSocketConfig {
  cors?: {
    origin: string | string[];
    methods: string[];
  };
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

interface ConnectedClient {
  id: string;
  userId?: string;
  tenantId: string;
  channels: Set<string>;
  lastActivity: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private config: Required<WebSocketConfig>;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(server: HTTPServer, config: WebSocketConfig = {}) {
    this.config = {
      cors: config.cors || {
        origin: ["http://localhost:3000", "https://apps.abacus.ai"],
        methods: ["GET", "POST"]
      },
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      connectionTimeout: config.connectionTimeout || 60000, // 1 minute
      ...config
    };

    this.prisma = new PrismaClient();
    this.io = new SocketIOServer(server, {
      cors: this.config.cors,
      transports: ['websocket', 'polling']
    });

    this.initializeSocketHandlers();
    this.startHeartbeat();
  }

  /**
   * Initialize Socket.IO event handlers
   */
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data: { userId?: string; tenantId: string; token?: string }) => {
        try {
          // In production, validate the token here
          const client: ConnectedClient = {
            id: socket.id,
            userId: data.userId,
            tenantId: data.tenantId,
            channels: new Set(['general']),
            lastActivity: new Date()
          };

          this.connectedClients.set(socket.id, client);

          // Join tenant-specific room
          socket.join(`tenant:${data.tenantId}`);
          
          // Join user-specific room if authenticated
          if (data.userId) {
            socket.join(`user:${data.userId}`);
          }

          socket.emit('authenticated', { status: 'success', clientId: socket.id });
          
          // Send pending notifications
          await this.sendPendingNotifications(socket, data.tenantId, data.userId);
        } catch (error) {
          socket.emit('authentication_error', { 
            error: error instanceof Error ? error.message : 'Authentication failed' 
          });
        }
      });

      // Handle channel subscription
      socket.on('subscribe', (data: { channel: string }) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.channels.add(data.channel);
          socket.join(`channel:${data.channel}`);
          socket.emit('subscribed', { channel: data.channel });
        }
      });

      // Handle channel unsubscription
      socket.on('unsubscribe', (data: { channel: string }) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.channels.delete(data.channel);
          socket.leave(`channel:${data.channel}`);
          socket.emit('unsubscribed', { channel: data.channel });
        }
      });

      // Handle heartbeat/ping
      socket.on('ping', () => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.lastActivity = new Date();
          socket.emit('pong', { timestamp: new Date().toISOString() });
        }
      });

      // Handle notification read
      socket.on('mark_notification_read', async (data: { notificationId: string }) => {
        try {
          await this.markNotificationAsRead(data.notificationId);
          socket.emit('notification_marked_read', { notificationId: data.notificationId });
        } catch (error) {
          socket.emit('error', { 
            error: error instanceof Error ? error.message : 'Failed to mark notification as read' 
          });
        }
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Broadcast real-time update to all connected clients
   */
  async broadcastUpdate(update: RealtimeUpdate): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'REALTIME_UPDATE',
      payload: update,
      timestamp: new Date()
    };

    // Broadcast to tenant room
    this.io.to(`tenant:${update.tenantId}`).emit('realtime_update', message);

    // Broadcast to specific user if specified
    if (update.userId) {
      this.io.to(`user:${update.userId}`).emit('realtime_update', message);
    }
  }

  /**
   * Send notification to specific user or broadcast to tenant
   */
  async sendNotification(notification: {
    title: string;
    message: string;
    type: NotificationType;
    severity: NotificationSeverity;
    tenantId: string;
    userId?: string;
    data?: any;
    isPersistent?: boolean;
    channel?: string;
  }): Promise<void> {
    // Store notification in database if persistent
    let notificationRecord: any = null;
    if (notification.isPersistent !== false) {
      notificationRecord = await this.prisma.realTimeNotification.create({
        data: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          severity: notification.severity,
          data: notification.data,
          tenantId: notification.tenantId,
          userId: notification.userId,
          channel: notification.channel,
          isPersistent: notification.isPersistent ?? true
        }
      });
    }

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'NOTIFICATION',
      payload: {
        id: notificationRecord?.id,
        ...notification,
        timestamp: new Date()
      },
      timestamp: new Date(),
      channel: notification.channel
    };

    // Send to specific user or broadcast to tenant
    if (notification.userId) {
      this.io.to(`user:${notification.userId}`).emit('notification', message);
    } else {
      this.io.to(`tenant:${notification.tenantId}`).emit('notification', message);
    }

    // Send to specific channel if specified
    if (notification.channel) {
      this.io.to(`channel:${notification.channel}`).emit('notification', message);
    }
  }

  /**
   * Send event-driven chart update
   */
  async sendChartUpdate(update: {
    chartId: string;
    data: any;
    tenantId: string;
    userId?: string;
    metadata?: any;
  }): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'REALTIME_UPDATE',
      payload: {
        type: 'CHART_UPDATE',
        chartId: update.chartId,
        data: update.data,
        metadata: update.metadata,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    // Send to tenant or specific user
    if (update.userId) {
      this.io.to(`user:${update.userId}`).emit('chart_update', message);
    } else {
      this.io.to(`tenant:${update.tenantId}`).emit('chart_update', message);
    }
  }

  /**
   * Send workflow status update
   */
  async sendWorkflowUpdate(update: {
    workflowId: string;
    status: string;
    currentStep?: number;
    totalSteps?: number;
    tenantId: string;
    userId?: string;
    data?: any;
  }): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'REALTIME_UPDATE',
      payload: {
        type: 'WORKFLOW_UPDATE',
        workflowId: update.workflowId,
        status: update.status,
        currentStep: update.currentStep,
        totalSteps: update.totalSteps,
        data: update.data,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    // Send to tenant or specific user
    if (update.userId) {
      this.io.to(`user:${update.userId}`).emit('workflow_update', message);
    } else {
      this.io.to(`tenant:${update.tenantId}`).emit('workflow_update', message);
    }
  }

  /**
   * Send pending notifications to newly connected client
   */
  private async sendPendingNotifications(
    socket: any, 
    tenantId: string, 
    userId?: string
  ): Promise<void> {
    try {
      const whereClause: any = {
        tenantId,
        isRead: false,
        OR: [
          { userId: null }, // Broadcast notifications
          ...(userId ? [{ userId }] : []) // User-specific notifications
        ]
      };

      // Also include non-expired notifications
      const now = new Date();
      whereClause.OR.push({ expiresAt: null });
      whereClause.OR.push({ expiresAt: { gt: now } });

      const pendingNotifications = await this.prisma.realTimeNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to recent notifications
      });

      for (const notification of pendingNotifications) {
        const message: WebSocketMessage = {
          id: this.generateMessageId(),
          type: 'NOTIFICATION',
          payload: notification,
          timestamp: new Date()
        };

        socket.emit('notification', message);
      }
    } catch (error) {
      console.error('Failed to send pending notifications:', error);
    }
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.prisma.realTimeNotification.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Start heartbeat to monitor connections
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - this.config.connectionTimeout);

      // Check for stale connections
      for (const [socketId, client] of this.connectedClients.entries()) {
        if (client.lastActivity < timeoutThreshold) {
          console.log(`Removing stale connection: ${socketId}`);
          this.connectedClients.delete(socketId);
          this.io.sockets.sockets.get(socketId)?.disconnect(true);
        }
      }

      // Send heartbeat to all connected clients
      this.io.emit('heartbeat', { timestamp: now.toISOString() });
    }, this.config.heartbeatInterval);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    tenantBreakdown: { [tenantId: string]: number };
  } {
    const totalConnections = this.connectedClients.size;
    let authenticatedConnections = 0;
    const tenantBreakdown: { [tenantId: string]: number } = {};

    for (const client of this.connectedClients.values()) {
      if (client.userId) {
        authenticatedConnections++;
      }

      tenantBreakdown[client.tenantId] = (tenantBreakdown[client.tenantId] || 0) + 1;
    }

    return {
      totalConnections,
      authenticatedConnections,
      tenantBreakdown
    };
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    
    await this.prisma.realTimeNotification.deleteMany({
      where: {
        expiresAt: { lt: now },
        isPersistent: false
      }
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown WebSocket service
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Disconnect all clients
    this.io.disconnectSockets(true);

    // Close database connection
    await this.prisma.$disconnect();

    console.log('WebSocket service shut down');
  }
}

// Global WebSocket service instance
let webSocketServiceInstance: WebSocketService | null = null;

export function initializeWebSocketService(server: HTTPServer, config?: WebSocketConfig): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(server, config);
  }
  return webSocketServiceInstance;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketServiceInstance;
}
