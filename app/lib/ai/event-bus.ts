
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import {
  EventBusItem,
  EventHandler,
  EventPayload,
  EventMetadata,
  EventProcessingMetrics,
  EventBusConfig
} from '../types';
import {
  EventType,
  EventPriority,
  EventStatus,
  HandlerStatus
} from '@prisma/client';

interface EventBusOptions {
  maxConcurrency?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  metricsEnabled?: boolean;
}

export class EventBusService extends EventEmitter {
  private prisma: PrismaClient;
  private handlers: Map<string, EventHandler[]> = new Map();
  private processingQueue: EventBusItem[] = [];
  private isProcessing = false;
  private options: Required<EventBusOptions>;
  private metrics: Map<string, EventProcessingMetrics> = new Map();

  constructor(options: EventBusOptions = {}) {
    super();
    this.prisma = new PrismaClient();
    this.options = {
      maxConcurrency: options.maxConcurrency || 10,
      retryPolicy: options.retryPolicy || {
        maxRetries: 3,
        backoffMultiplier: 1.5,
        initialDelay: 1000
      },
      metricsEnabled: options.metricsEnabled !== false
    };

    // Start background processing
    this.startProcessing();
  }

  /**
   * Publish an event to the event bus
   */
  async publishEvent(
    eventName: string,
    eventType: EventType,
    payload: EventPayload,
    metadata: EventMetadata,
    options: {
      priority?: EventPriority;
      target?: string;
      scheduledAt?: Date;
      correlationId?: string;
    } = {}
  ): Promise<string> {
    try {
      const event = await this.prisma.eventBus.create({
        data: {
          eventType,
          eventName,
          source: metadata.source,
          target: options.target,
          payload,
          metadata: {
            ...metadata,
            correlationId: options.correlationId || this.generateCorrelationId(),
            traceId: this.generateTraceId()
          },
          priority: options.priority || EventPriority.MEDIUM,
          scheduledAt: options.scheduledAt,
          tenantId: metadata.tenantId
        }
      });

      // Add to processing queue if not scheduled
      if (!options.scheduledAt || options.scheduledAt <= new Date()) {
        this.processingQueue.push(event);
        this.emit('event:queued', event);
      }

      // Create correlation if specified
      if (options.correlationId) {
        await this.createEventCorrelation(event.id, options.correlationId);
      }

      return event.id;
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events with a handler
   */
  registerHandler(
    eventPattern: string,
    handler: EventHandler
  ): void {
    if (!this.handlers.has(eventPattern)) {
      this.handlers.set(eventPattern, []);
    }

    const handlers = this.handlers.get(eventPattern)!;
    handlers.push(handler);
    handlers.sort((a, b) => a.priority - b.priority);

    // Register subscription in database
    this.registerSubscription(eventPattern, handler);
  }

  /**
   * Start the event processing loop
   */
  private startProcessing(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processEvents();
      }
      
      // Process scheduled events
      await this.processScheduledEvents();
    }, 100); // Check every 100ms
  }

  /**
   * Process events in the queue
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const concurrentLimit = this.options.maxConcurrency;
    
    try {
      while (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, concurrentLimit);
        const promises = batch.map(event => this.processEvent(event));
        await Promise.allSettled(promises);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: EventBusItem): Promise<void> {
    const startTime = new Date();
    const handlerResults: any[] = [];

    try {
      // Update event status to processing
      await this.updateEventStatus(event.id, EventStatus.PROCESSING);

      // Find matching handlers
      const matchingHandlers = this.findMatchingHandlers(event);

      if (matchingHandlers.length === 0) {
        console.warn(`No handlers found for event: ${event.eventName}`);
        await this.updateEventStatus(event.id, EventStatus.COMPLETED);
        return;
      }

      // Execute handlers
      for (const handler of matchingHandlers) {
        const handlerStartTime = new Date();
        
        try {
          // Create handler record
          const handlerRecord = await this.prisma.eventHandler.create({
            data: {
              eventBusId: event.id,
              handlerName: handler.name,
              module: handler.module,
              status: HandlerStatus.EXECUTING,
              tenantId: event.tenantId
            }
          });

          // Execute handler
          const result = await handler.handler(event);

          // Update handler status
          await this.prisma.eventHandler.update({
            where: { id: handlerRecord.id },
            data: {
              status: HandlerStatus.COMPLETED,
              executedAt: new Date(),
              executionTime: Date.now() - handlerStartTime.getTime(),
              result
            }
          });

          handlerResults.push({
            handlerName: handler.name,
            duration: Date.now() - handlerStartTime.getTime(),
            status: 'SUCCESS'
          });

        } catch (error) {
          console.error(`Handler ${handler.name} failed:`, error);
          
          handlerResults.push({
            handlerName: handler.name,
            duration: Date.now() - handlerStartTime.getTime(),
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update event status
      await this.updateEventStatus(event.id, EventStatus.COMPLETED, new Date());
      
      // Record metrics
      if (this.options.metricsEnabled) {
        this.recordMetrics(event, startTime, new Date(), 'SUCCESS', handlerResults);
      }

      this.emit('event:completed', event);

    } catch (error) {
      console.error(`Event processing failed for ${event.id}:`, error);
      
      // Retry logic
      if (event.retryCount < event.maxRetries) {
        await this.scheduleRetry(event);
      } else {
        await this.updateEventStatus(
          event.id, 
          EventStatus.FAILED, 
          new Date(),
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      // Record metrics
      if (this.options.metricsEnabled) {
        this.recordMetrics(event, startTime, new Date(), 'FAILED', handlerResults, 
          error instanceof Error ? error.message : 'Unknown error');
      }

      this.emit('event:failed', event, error);
    }
  }

  /**
   * Find handlers that match an event
   */
  private findMatchingHandlers(event: EventBusItem): EventHandler[] {
    const matchingHandlers: EventHandler[] = [];

    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchesPattern(event.eventName, pattern)) {
        for (const handler of handlers) {
          // Apply filter if defined
          if (!handler.filter || handler.filter(event)) {
            matchingHandlers.push(handler);
          }
        }
      }
    }

    return matchingHandlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if event name matches pattern
   */
  private matchesPattern(eventName: string, pattern: string): boolean {
    // Convert pattern to regex (support wildcards)
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(eventName);
  }

  /**
   * Process scheduled events
   */
  private async processScheduledEvents(): Promise<void> {
    try {
      const scheduledEvents = await this.prisma.eventBus.findMany({
        where: {
          status: EventStatus.PENDING,
          scheduledAt: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: 10
      });

      for (const event of scheduledEvents) {
        this.processingQueue.push(event);
      }
    } catch (error) {
      console.error('Failed to process scheduled events:', error);
    }
  }

  /**
   * Schedule an event retry
   */
  private async scheduleRetry(event: EventBusItem): Promise<void> {
    const retryCount = event.retryCount + 1;
    const delay = this.calculateRetryDelay(retryCount);
    const scheduledAt = new Date(Date.now() + delay);

    await this.prisma.eventBus.update({
      where: { id: event.id },
      data: {
        status: EventStatus.RETRYING,
        retryCount,
        scheduledAt
      }
    });
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const { initialDelay, backoffMultiplier } = this.options.retryPolicy;
    return initialDelay * Math.pow(backoffMultiplier, retryCount - 1);
  }

  /**
   * Update event status
   */
  private async updateEventStatus(
    eventId: string,
    status: EventStatus,
    processedAt?: Date,
    errorLog?: string
  ): Promise<void> {
    await this.prisma.eventBus.update({
      where: { id: eventId },
      data: {
        status,
        processedAt,
        errorLog,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Record processing metrics
   */
  private recordMetrics(
    event: EventBusItem,
    startTime: Date,
    endTime: Date,
    status: 'SUCCESS' | 'FAILED',
    handlerResults: any[],
    errorMessage?: string
  ): void {
    const metrics: EventProcessingMetrics = {
      eventId: event.id,
      processingStartTime: startTime,
      processingEndTime: endTime,
      duration: endTime.getTime() - startTime.getTime(),
      status,
      errorMessage,
      handlerResults
    };

    this.metrics.set(event.id, metrics);
  }

  /**
   * Create event correlation
   */
  private async createEventCorrelation(
    eventId: string,
    correlationId: string,
    parentEventId?: string,
    workflowId?: string
  ): Promise<void> {
    const event = await this.prisma.eventBus.findUnique({
      where: { id: eventId }
    });

    if (!event) return;

    await this.prisma.eventCorrelation.create({
      data: {
        correlationId,
        eventBusId: eventId,
        parentEventId,
        workflowId,
        tenantId: event.tenantId
      }
    });
  }

  /**
   * Register event subscription
   */
  private async registerSubscription(
    eventPattern: string,
    handler: EventHandler
  ): Promise<void> {
    try {
      // For now, we'll use a default tenantId - in production, this should be tenant-aware
      // Check if subscription already exists
      const existingSubscription = await this.prisma.eventSubscription.findFirst({
        where: {
          subscriberId: handler.name,
          eventPattern,
          tenantId: 'default'
        }
      });

      if (!existingSubscription) {
        await this.prisma.eventSubscription.create({
          data: {
            subscriberId: handler.name,
            eventPattern,
            priority: handler.priority,
            tenantId: 'default' // This should be dynamic based on context
          }
        });
      }
    } catch (error) {
      console.error('Failed to register subscription:', error);
    }
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event processing metrics
   */
  getMetrics(): Map<string, EventProcessingMetrics> {
    return this.metrics;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    this.removeAllListeners();
  }
}

// Singleton instance
let eventBusInstance: EventBusService | null = null;

export function getEventBus(): EventBusService {
  if (!eventBusInstance) {
    eventBusInstance = new EventBusService();
  }
  return eventBusInstance;
}
