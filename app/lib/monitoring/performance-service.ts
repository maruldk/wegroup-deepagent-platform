
/**
 * HYBRID SPRINT 2.1: Performance Monitoring Service
 * Real-time performance tracking and alerting
 */

import { PrismaClient } from '@prisma/client';
import { PerformanceMetricType, PerformanceMetricItem } from '@/lib/types';

const prisma = new PrismaClient();

export interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  threshold: number;
  currentValue: number;
  endpoint?: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
}

export interface PerformanceThreshold {
  metricType: PerformanceMetricType;
  warning: number;
  critical: number;
  endpoint?: string;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private alertQueue: PerformanceAlert[] = [];

  private constructor() {
    this.initializeDefaultThresholds();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeDefaultThresholds(): void {
    // API Response Time thresholds
    this.thresholds.set('API_RESPONSE_TIME', {
      metricType: PerformanceMetricType.API_RESPONSE_TIME,
      warning: 1000, // 1 second
      critical: 3000  // 3 seconds
    });

    // Database Query Time thresholds
    this.thresholds.set('DATABASE_QUERY_TIME', {
      metricType: PerformanceMetricType.DATABASE_QUERY_TIME,
      warning: 500,  // 500ms
      critical: 2000 // 2 seconds
    });

    // CPU Usage thresholds
    this.thresholds.set('CPU_USAGE', {
      metricType: PerformanceMetricType.CPU_USAGE,
      warning: 70,  // 70%
      critical: 90  // 90%
    });

    // Memory Usage thresholds
    this.thresholds.set('MEMORY_USAGE', {
      metricType: PerformanceMetricType.MEMORY_USAGE,
      warning: 80,  // 80%
      critical: 95  // 95%
    });

    // Error Rate thresholds
    this.thresholds.set('ERROR_RATE', {
      metricType: PerformanceMetricType.ERROR_RATE,
      warning: 5,   // 5%
      critical: 15  // 15%
    });

    // Throughput thresholds (requests per second)
    this.thresholds.set('THROUGHPUT', {
      metricType: PerformanceMetricType.THROUGHPUT,
      warning: 10,   // Below 10 RPS
      critical: 5    // Below 5 RPS
    });
  }

  /**
   * Record performance metric
   */
  async recordMetric(
    metricType: PerformanceMetricType,
    value: number,
    endpoint?: string,
    additionalData?: {
      cpuUsage?: number;
      memoryUsage?: number;
      dbQueryTime?: number;
      errorRate?: number;
      throughput?: number;
    },
    tenantId?: string
  ): Promise<PerformanceMetricItem> {
    try {
      const metric = await prisma.performanceMetric.create({
        data: {
          metricType,
          endpoint,
          responseTime: metricType === PerformanceMetricType.API_RESPONSE_TIME ? value : 0,
          cpuUsage: additionalData?.cpuUsage,
          memoryUsage: additionalData?.memoryUsage,
          dbQueryTime: additionalData?.dbQueryTime || 
                      (metricType === PerformanceMetricType.DATABASE_QUERY_TIME ? value : undefined),
          errorRate: additionalData?.errorRate ||
                    (metricType === PerformanceMetricType.ERROR_RATE ? value : undefined),
          throughput: additionalData?.throughput ||
                     (metricType === PerformanceMetricType.THROUGHPUT ? value : undefined),
          timestamp: new Date(),
          tenantId
        }
      });

      // Check thresholds and trigger alerts
      await this.checkThresholds(metricType, value, endpoint);

      return {
        id: metric.id,
        metricType: metric.metricType,
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        cpuUsage: metric.cpuUsage,
        memoryUsage: metric.memoryUsage,
        dbQueryTime: metric.dbQueryTime,
        errorRate: metric.errorRate,
        throughput: metric.throughput,
        timestamp: metric.timestamp,
        tenantId: metric.tenantId
      };
    } catch (error) {
      console.error('Failed to record performance metric:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics with filtering
   */
  async getMetrics(filters: {
    metricType?: PerformanceMetricType;
    endpoint?: string;
    tenantId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<PerformanceMetricItem[]> {
    try {
      const where: any = {};

      if (filters.metricType) where.metricType = filters.metricType;
      if (filters.endpoint) where.endpoint = filters.endpoint;
      if (filters.tenantId) where.tenantId = filters.tenantId;
      
      if (filters.startTime || filters.endTime) {
        where.timestamp = {};
        if (filters.startTime) where.timestamp.gte = filters.startTime;
        if (filters.endTime) where.timestamp.lte = filters.endTime;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100
      });

      return metrics.map(metric => ({
        id: metric.id,
        metricType: metric.metricType,
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        cpuUsage: metric.cpuUsage,
        memoryUsage: metric.memoryUsage,
        dbQueryTime: metric.dbQueryTime,
        errorRate: metric.errorRate,
        throughput: metric.throughput,
        timestamp: metric.timestamp,
        tenantId: metric.tenantId
      }));
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(
    tenantId?: string,
    timeRange: number = 24 // hours
  ): Promise<{
    overallScore: number;
    averageResponseTime: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    averageDbQueryTime: number;
    errorRate: number;
    throughput: number;
    alerts: {
      active: number;
      total: number;
      critical: number;
    };
    trends: Array<{
      timestamp: Date;
      responseTime: number;
      cpuUsage: number;
      memoryUsage: number;
      errorRate: number;
    }>;
  }> {
    try {
      const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      const where: any = {
        timestamp: { gte: startTime }
      };
      if (tenantId) where.tenantId = tenantId;

      const [
        responseTimeAvg,
        cpuUsageAvg,
        memoryUsageAvg,
        dbQueryTimeAvg,
        errorRateAvg,
        throughputAvg,
        hourlyStats
      ] = await Promise.all([
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.API_RESPONSE_TIME },
          _avg: { responseTime: true }
        }),
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.CPU_USAGE },
          _avg: { cpuUsage: true }
        }),
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.MEMORY_USAGE },
          _avg: { memoryUsage: true }
        }),
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.DATABASE_QUERY_TIME },
          _avg: { dbQueryTime: true }
        }),
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.ERROR_RATE },
          _avg: { errorRate: true }
        }),
        prisma.performanceMetric.aggregate({
          where: { ...where, metricType: PerformanceMetricType.THROUGHPUT },
          _avg: { throughput: true }
        }),
        this.getHourlyTrends(startTime, tenantId)
      ]);

      // Calculate overall performance score (0-100)
      const avgResponseTime = responseTimeAvg._avg.responseTime || 0;
      const avgCpuUsage = cpuUsageAvg._avg.cpuUsage || 0;
      const avgMemoryUsage = memoryUsageAvg._avg.memoryUsage || 0;
      const avgErrorRate = errorRateAvg._avg.errorRate || 0;

      const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // 1000ms = 0 points
      const cpuScore = Math.max(0, 100 - avgCpuUsage);
      const memoryScore = Math.max(0, 100 - avgMemoryUsage);
      const errorScore = Math.max(0, 100 - (avgErrorRate * 10)); // 10% error = 0 points

      const overallScore = Math.round(
        (responseTimeScore + cpuScore + memoryScore + errorScore) / 4
      );

      return {
        overallScore,
        averageResponseTime: avgResponseTime,
        averageCpuUsage: avgCpuUsage,
        averageMemoryUsage: avgMemoryUsage,
        averageDbQueryTime: dbQueryTimeAvg._avg.dbQueryTime || 0,
        errorRate: avgErrorRate,
        throughput: throughputAvg._avg.throughput || 0,
        alerts: {
          active: this.alertQueue.filter(a => !a.acknowledgedAt).length,
          total: this.alertQueue.length,
          critical: this.alertQueue.filter(a => 
            a.severity === 'CRITICAL' && !a.acknowledgedAt
          ).length
        },
        trends: hourlyStats
      };
    } catch (error) {
      console.error('Failed to get performance statistics:', error);
      return {
        overallScore: 0,
        averageResponseTime: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageDbQueryTime: 0,
        errorRate: 0,
        throughput: 0,
        alerts: { active: 0, total: 0, critical: 0 },
        trends: []
      };
    }
  }

  /**
   * Get hourly performance trends
   */
  private async getHourlyTrends(
    startTime: Date,
    tenantId?: string
  ): Promise<Array<{
    timestamp: Date;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    errorRate: number;
  }>> {
    try {
      // Group metrics by hour and calculate averages
      const trends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          AVG(CASE WHEN metric_type = 'API_RESPONSE_TIME' THEN response_time END) as avg_response_time,
          AVG(CASE WHEN metric_type = 'CPU_USAGE' THEN cpu_usage END) as avg_cpu_usage,
          AVG(CASE WHEN metric_type = 'MEMORY_USAGE' THEN memory_usage END) as avg_memory_usage,
          AVG(CASE WHEN metric_type = 'ERROR_RATE' THEN error_rate END) as avg_error_rate
        FROM performance_metrics
        WHERE timestamp >= ${startTime}
          ${tenantId ? 'AND tenant_id = $1' : ''}
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour ASC
      `;

      return Array.isArray(trends) ? trends.map((trend: any) => ({
        timestamp: new Date(trend.hour),
        responseTime: parseFloat(trend.avg_response_time) || 0,
        cpuUsage: parseFloat(trend.avg_cpu_usage) || 0,
        memoryUsage: parseFloat(trend.avg_memory_usage) || 0,
        errorRate: parseFloat(trend.avg_error_rate) || 0
      })) : [];
    } catch (error) {
      console.error('Failed to get hourly trends:', error);
      return [];
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  private async checkThresholds(
    metricType: PerformanceMetricType,
    value: number,
    endpoint?: string
  ): Promise<void> {
    const threshold = this.thresholds.get(metricType.toString());
    if (!threshold) return;

    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null = null;
    let message = '';

    if (value >= threshold.critical) {
      severity = 'CRITICAL';
      message = `${metricType} exceeded critical threshold: ${value} >= ${threshold.critical}`;
    } else if (value >= threshold.warning) {
      severity = 'HIGH';
      message = `${metricType} exceeded warning threshold: ${value} >= ${threshold.warning}`;
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: metricType,
        severity,
        message,
        threshold: severity === 'CRITICAL' ? threshold.critical : threshold.warning,
        currentValue: value,
        endpoint,
        triggeredAt: new Date()
      };

      this.alertQueue.push(alert);

      // Log critical alerts
      if (severity === 'CRITICAL') {
        console.error('CRITICAL PERFORMANCE ALERT:', alert);
      }

      // In production, trigger notifications here
      await this.triggerNotification(alert);
    }
  }

  /**
   * Trigger performance alert notification
   */
  private async triggerNotification(alert: PerformanceAlert): Promise<void> {
    // In production, implement actual notification system
    console.warn('Performance Alert:', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      endpoint: alert.endpoint,
      currentValue: alert.currentValue,
      threshold: alert.threshold
    });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alertQueue.filter(alert => !alert.acknowledgedAt);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertQueue.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Record API request performance
   */
  async recordApiRequest(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    tenantId?: string
  ): Promise<void> {
    try {
      // Record response time
      await this.recordMetric(
        PerformanceMetricType.API_RESPONSE_TIME,
        responseTime,
        endpoint,
        undefined,
        tenantId
      );

      // Track error rate
      const isError = statusCode >= 400;
      if (isError) {
        await this.recordMetric(
          PerformanceMetricType.ERROR_RATE,
          1, // Individual error
          endpoint,
          undefined,
          tenantId
        );
      }
    } catch (error) {
      console.error('Failed to record API request performance:', error);
    }
  }

  /**
   * Record system metrics
   */
  async recordSystemMetrics(
    cpuUsage: number,
    memoryUsage: number,
    tenantId?: string
  ): Promise<void> {
    try {
      await Promise.all([
        this.recordMetric(
          PerformanceMetricType.CPU_USAGE,
          cpuUsage,
          undefined,
          { cpuUsage },
          tenantId
        ),
        this.recordMetric(
          PerformanceMetricType.MEMORY_USAGE,
          memoryUsage,
          undefined,
          { memoryUsage },
          tenantId
        )
      ]);
    } catch (error) {
      console.error('Failed to record system metrics:', error);
    }
  }

  /**
   * Clean old metrics (keep only last 30 days)
   */
  async cleanOldMetrics(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await prisma.performanceMetric.deleteMany({
        where: {
          timestamp: { lt: thirtyDaysAgo }
        }
      });

      // Clean old alerts from memory
      this.alertQueue = this.alertQueue.filter(
        alert => alert.triggeredAt > thirtyDaysAgo
      );
    } catch (error) {
      console.error('Failed to clean old metrics:', error);
    }
  }

  /**
   * Update performance thresholds
   */
  updateThreshold(
    metricType: PerformanceMetricType,
    warning: number,
    critical: number,
    endpoint?: string
  ): void {
    const key = endpoint ? `${metricType}_${endpoint}` : metricType.toString();
    this.thresholds.set(key, {
      metricType,
      warning,
      critical,
      endpoint
    });
  }
}

export const performanceService = PerformanceService.getInstance();
