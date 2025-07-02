
import { EventEmitter } from 'events';
import { useEffect, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  requestId?: string;
}

export interface DashboardUpdate {
  dashboardId: string;
  widgetId: string;
  data: any;
  timestamp: number;
}

export interface AnalyticsEvent {
  type: 'metric_update' | 'data_refresh' | 'alert' | 'insight';
  category: 'analytics' | 'finance' | 'project' | 'ai';
  data: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class WebSocketService extends EventEmitter {
  private static instance: WebSocketService | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private isConnecting = false;
  private subscriptions = new Set<string>();
  private messageQueue: WebSocketMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        this.once('connected', resolve);
        this.once('error', reject);
        return;
      }

      this.isConnecting = true;
      const wsUrl = url || this.getWebSocketUrl();

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectInterval = 1000;
          
          // Send queued messages
          this.flushMessageQueue();
          
          // Re-subscribe to channels
          this.resubscribe();
          
          // Start heartbeat
          this.startHeartbeat();
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.subscriptions.clear();
    this.messageQueue = [];
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Send message to server
  send(type: string, payload: any, requestId?: string): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      requestId
    };

    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.warn('WebSocket not connected, message queued:', type);
    }
  }

  // Subscribe to dashboard updates
  subscribeToDashboard(dashboardId: string): void {
    const subscription = `dashboard:${dashboardId}`;
    this.subscriptions.add(subscription);
    this.send('subscribe', { channel: subscription });
  }

  // Unsubscribe from dashboard updates
  unsubscribeFromDashboard(dashboardId: string): void {
    const subscription = `dashboard:${dashboardId}`;
    this.subscriptions.delete(subscription);
    this.send('unsubscribe', { channel: subscription });
  }

  // Subscribe to analytics events
  subscribeToAnalytics(category?: string): void {
    const subscription = category ? `analytics:${category}` : 'analytics:*';
    this.subscriptions.add(subscription);
    this.send('subscribe', { channel: subscription });
  }

  // Subscribe to AI insights
  subscribeToAIInsights(tenantId: string): void {
    const subscription = `ai:insights:${tenantId}`;
    this.subscriptions.add(subscription);
    this.send('subscribe', { channel: subscription });
  }

  // Subscribe to real-time metrics
  subscribeToMetrics(metricIds: string[]): void {
    metricIds.forEach(metricId => {
      const subscription = `metric:${metricId}`;
      this.subscriptions.add(subscription);
      this.send('subscribe', { channel: subscription });
    });
  }

  // Request real-time data for widget
  requestWidgetData(widgetId: string, config: any): void {
    this.send('widget_data_request', {
      widgetId,
      config,
      requestId: `widget_${widgetId}_${Date.now()}`
    });
  }

  // Send widget interaction event
  sendWidgetInteraction(widgetId: string, interaction: any): void {
    this.send('widget_interaction', {
      widgetId,
      interaction,
      timestamp: Date.now()
    });
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'dashboard_update':
        this.handleDashboardUpdate(message.payload as DashboardUpdate);
        break;
      
      case 'analytics_event':
        this.handleAnalyticsEvent(message.payload as AnalyticsEvent);
        break;
      
      case 'widget_data':
        this.emit('widget_data', message.payload);
        break;
      
      case 'metric_update':
        this.emit('metric_update', message.payload);
        break;
      
      case 'ai_insight':
        this.emit('ai_insight', message.payload);
        break;
      
      case 'alert':
        this.emit('alert', message.payload);
        break;
      
      case 'pong':
        // Heartbeat response
        break;
      
      case 'error':
        console.error('WebSocket server error:', message.payload);
        this.emit('server_error', message.payload);
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
        this.emit('message', message);
    }
  }

  private handleDashboardUpdate(update: DashboardUpdate): void {
    this.emit('dashboard_update', update);
    this.emit(`dashboard_update:${update.dashboardId}`, update);
    this.emit(`widget_update:${update.widgetId}`, update);
  }

  private handleAnalyticsEvent(event: AnalyticsEvent): void {
    this.emit('analytics_event', event);
    this.emit(`analytics_event:${event.type}`, event);
    this.emit(`analytics_event:${event.category}`, event);
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/websocket`;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Sending ${this.messageQueue.length} queued messages`);
      this.messageQueue.forEach(message => {
        this.ws!.send(JSON.stringify(message));
      });
      this.messageQueue = [];
    }
  }

  private resubscribe(): void {
    this.subscriptions.forEach(subscription => {
      this.send('subscribe', { channel: subscription });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// WebSocket utilities
export const websocketUtils = {
  getInstance(): WebSocketService {
    return WebSocketService.getInstance();
  },

  async connect(): Promise<void> {
    const ws = WebSocketService.getInstance();
    if (!ws.isConnected()) {
      return ws.connect();
    }
  },

  subscribe(event: string, handler: (...args: any[]) => void) {
    const ws = WebSocketService.getInstance();
    ws.on(event, handler);
    
    return () => {
      ws.off(event, handler);
    };
  },

  send(type: string, payload: any, requestId?: string) {
    const ws = WebSocketService.getInstance();
    ws.send(type, payload, requestId);
  },

  subscribeToDashboard(dashboardId: string) {
    const ws = WebSocketService.getInstance();
    ws.subscribeToDashboard(dashboardId);
    
    return () => {
      ws.unsubscribeFromDashboard(dashboardId);
    };
  },

  subscribeToAnalytics(category?: string) {
    const ws = WebSocketService.getInstance();
    ws.subscribeToAnalytics(category);
  },

  subscribeToMetrics(metricIds: string[]) {
    const ws = WebSocketService.getInstance();
    ws.subscribeToMetrics(metricIds);
  },

  requestWidgetData(widgetId: string, config: any) {
    const ws = WebSocketService.getInstance();
    ws.requestWidgetData(widgetId, config);
  }
};

// React Hook for WebSocket usage
export function useWebSocket() {
  const ws = WebSocketService.getInstance();

  useEffect(() => {
    // Auto-connect when hook is used
    if (typeof window !== 'undefined') {
      ws.connect().catch(console.error);
    }

    return () => {
      // Cleanup handled by WebSocketService singleton
    };
  }, []);

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    ws.on(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      ws.off(eventType, callback);
    };
  }, [ws]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    ws.send(message.type, message.payload, message.requestId);
  }, [ws]);

  const requestWidgetData = useCallback((widgetId: string, config: any) => {
    ws.requestWidgetData(widgetId, config);
  }, [ws]);

  return {
    subscribe,
    sendMessage,
    requestWidgetData,
    isConnected: ws.isConnected?.() ?? false
  };
}

export default WebSocketService;
