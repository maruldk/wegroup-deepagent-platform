
/**
 * HYBRID SPRINT 2.1: Security Audit Service
 * Enhanced audit logging with risk assessment and threat detection
 */

import { PrismaClient } from '@prisma/client';
import { SecurityAction, SecurityAuditLogItem } from '@/lib/types';

const prisma = new PrismaClient();

export interface SecurityAuditEvent {
  userId?: string;
  sessionId?: string;
  action: SecurityAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  tenantId?: string;
}

export interface RiskAssessment {
  riskScore: number;
  factors: {
    unusualLocation: boolean;
    newDevice: boolean;
    suspiciousTime: boolean;
    multipleFailures: boolean;
    privilegedAction: boolean;
  };
  recommendation: string;
}

export class SecurityAuditService {
  private static instance: SecurityAuditService;

  private constructor() {}

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  /**
   * Log security audit event with risk assessment
   */
  async logAction(event: SecurityAuditEvent): Promise<SecurityAuditLogItem> {
    try {
      // Assess risk
      const riskAssessment = await this.assessRisk(event);
      
      // Determine location if IP address provided
      const location = event.ipAddress ? await this.getLocationFromIP(event.ipAddress) : null;

      const auditLog = await prisma.securityAuditLog.create({
        data: {
          userId: event.userId,
          sessionId: event.sessionId,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          location,
          riskScore: riskAssessment.riskScore,
          details: {
            ...event.details,
            riskAssessment
          },
          tenantId: event.tenantId
        }
      });

      // Trigger alerts for high-risk events
      if (riskAssessment.riskScore >= 0.7) {
        await this.triggerSecurityAlert(auditLog, riskAssessment);
      }

      return {
        id: auditLog.id,
        userId: auditLog.userId,
        sessionId: auditLog.sessionId,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        location: auditLog.location,
        riskScore: auditLog.riskScore,
        details: auditLog.details,
        tenantId: auditLog.tenantId,
        createdAt: auditLog.createdAt
      };
    } catch (error) {
      console.error('Failed to log security audit event:', error);
      throw error;
    }
  }

  /**
   * Get security audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    tenantId?: string;
    action?: SecurityAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    minRiskScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: SecurityAuditLogItem[];
    total: number;
  }> {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.tenantId) where.tenantId = filters.tenantId;
      if (filters.action) where.action = filters.action;
      if (filters.resource) where.resource = filters.resource;
      if (filters.minRiskScore) where.riskScore = { gte: filters.minRiskScore };
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.securityAuditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.securityAuditLog.count({ where })
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          userId: log.userId,
          sessionId: log.sessionId,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          location: log.location,
          riskScore: log.riskScore,
          details: log.details,
          tenantId: log.tenantId,
          createdAt: log.createdAt
        })),
        total
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(tenantId?: string, days: number = 30): Promise<{
    totalEvents: number;
    highRiskEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    topRisks: Array<{
      action: SecurityAction;
      count: number;
      avgRiskScore: number;
    }>;
    riskTrend: Array<{
      date: Date;
      riskScore: number;
      eventCount: number;
    }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        createdAt: { gte: startDate }
      };
      if (tenantId) where.tenantId = tenantId;

      const [
        totalEvents,
        highRiskEvents,
        failedLogins,
        suspiciousActivities,
        topRisks,
        dailyStats
      ] = await Promise.all([
        prisma.securityAuditLog.count({ where }),
        prisma.securityAuditLog.count({
          where: { ...where, riskScore: { gte: 0.7 } }
        }),
        prisma.securityAuditLog.count({
          where: { ...where, action: SecurityAction.LOGIN_FAILED }
        }),
        prisma.securityAuditLog.count({
          where: { ...where, action: SecurityAction.SUSPICIOUS_ACTIVITY }
        }),
        prisma.securityAuditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
          _avg: { riskScore: true },
          orderBy: { _avg: { riskScore: 'desc' } },
          take: 5
        }),
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            AVG(risk_score) as avg_risk_score,
            COUNT(*) as event_count
          FROM security_audit_logs
          WHERE created_at >= ${startDate}
            ${tenantId ? 'AND tenant_id = $1' : ''}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `
      ]);

      return {
        totalEvents,
        highRiskEvents,
        failedLogins,
        suspiciousActivities,
        topRisks: topRisks.map(risk => ({
          action: risk.action,
          count: risk._count.action,
          avgRiskScore: risk._avg.riskScore || 0
        })),
        riskTrend: Array.isArray(dailyStats) ? dailyStats.map((stat: any) => ({
          date: new Date(stat.date),
          riskScore: parseFloat(stat.avg_risk_score) || 0,
          eventCount: parseInt(stat.event_count) || 0
        })) : []
      };
    } catch (error) {
      console.error('Failed to get security statistics:', error);
      return {
        totalEvents: 0,
        highRiskEvents: 0,
        failedLogins: 0,
        suspiciousActivities: 0,
        topRisks: [],
        riskTrend: []
      };
    }
  }

  /**
   * Assess risk for security event
   */
  private async assessRisk(event: SecurityAuditEvent): Promise<RiskAssessment> {
    const factors = {
      unusualLocation: false,
      newDevice: false,
      suspiciousTime: false,
      multipleFailures: false,
      privilegedAction: false
    };

    let riskScore = 0;

    // Check for unusual location
    if (event.ipAddress && event.userId) {
      factors.unusualLocation = await this.isUnusualLocation(event.userId, event.ipAddress);
      if (factors.unusualLocation) riskScore += 0.3;
    }

    // Check for new device
    if (event.userAgent && event.userId) {
      factors.newDevice = await this.isNewDevice(event.userId, event.userAgent);
      if (factors.newDevice) riskScore += 0.2;
    }

    // Check for suspicious time (outside normal hours)
    const hour = new Date().getHours();
    factors.suspiciousTime = hour < 6 || hour > 22;
    if (factors.suspiciousTime) riskScore += 0.1;

    // Check for multiple recent failures
    if (event.userId) {
      factors.multipleFailures = await this.hasMultipleFailures(event.userId);
      if (factors.multipleFailures) riskScore += 0.4;
    }

    // Check for privileged actions
    const privilegedActions = [
      SecurityAction.ADMIN_ACTION,
      SecurityAction.DATA_EXPORT,
      SecurityAction.PASSWORD_RESET
    ];
    factors.privilegedAction = (privilegedActions as SecurityAction[]).includes(event.action);
    if (factors.privilegedAction) riskScore += 0.2;

    // Specific action risk scoring
    switch (event.action) {
      case SecurityAction.LOGIN_FAILED:
        riskScore += 0.3;
        break;
      case SecurityAction.SUSPICIOUS_ACTIVITY:
        riskScore += 0.8;
        break;
      case SecurityAction.PERMISSION_DENIED:
        riskScore += 0.5;
        break;
    }

    // Normalize risk score
    riskScore = Math.min(1, riskScore);

    const recommendation = this.getRiskRecommendation(riskScore, factors);

    return {
      riskScore,
      factors,
      recommendation
    };
  }

  /**
   * Check if IP address is unusual for user
   */
  private async isUnusualLocation(userId: string, ipAddress: string): Promise<boolean> {
    try {
      const recentLogs = await prisma.securityAuditLog.findMany({
        where: {
          userId,
          ipAddress: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: { ipAddress: true },
        distinct: ['ipAddress']
      });

      const knownIPs = recentLogs.map(log => log.ipAddress);
      return !knownIPs.includes(ipAddress);
    } catch (error) {
      console.error('Failed to check unusual location:', error);
      return false;
    }
  }

  /**
   * Check if user agent is new for user
   */
  private async isNewDevice(userId: string, userAgent: string): Promise<boolean> {
    try {
      const recentLogs = await prisma.securityAuditLog.findMany({
        where: {
          userId,
          userAgent: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: { userAgent: true },
        distinct: ['userAgent']
      });

      const knownUserAgents = recentLogs.map(log => log.userAgent);
      return !knownUserAgents.includes(userAgent);
    } catch (error) {
      console.error('Failed to check new device:', error);
      return false;
    }
  }

  /**
   * Check for multiple recent failures
   */
  private async hasMultipleFailures(userId: string): Promise<boolean> {
    try {
      const failureCount = await prisma.securityAuditLog.count({
        where: {
          userId,
          action: {
            in: [
              SecurityAction.LOGIN_FAILED,
              SecurityAction.TWO_FACTOR_FAILED,
              SecurityAction.OAUTH_FAILED
            ]
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      return failureCount >= 3;
    } catch (error) {
      console.error('Failed to check multiple failures:', error);
      return false;
    }
  }

  /**
   * Get location from IP address
   */
  private async getLocationFromIP(ipAddress: string): Promise<any> {
    try {
      // In production, use a proper geolocation service
      // For now, return null to avoid external dependencies
      return null;
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      return null;
    }
  }

  /**
   * Get risk recommendation based on score and factors
   */
  private getRiskRecommendation(riskScore: number, factors: any): string {
    if (riskScore >= 0.8) {
      return 'CRITICAL: Immediate investigation required. Consider blocking user account.';
    } else if (riskScore >= 0.6) {
      return 'HIGH: Monitor user activity closely. Consider additional verification.';
    } else if (riskScore >= 0.4) {
      return 'MEDIUM: Review user activity. Consider security awareness training.';
    } else if (riskScore >= 0.2) {
      return 'LOW: Normal activity with minor risk factors.';
    } else {
      return 'MINIMAL: Normal user activity detected.';
    }
  }

  /**
   * Trigger security alert for high-risk events
   */
  private async triggerSecurityAlert(auditLog: any, riskAssessment: RiskAssessment): Promise<void> {
    try {
      // In production, implement notification system
      console.warn('HIGH RISK SECURITY EVENT DETECTED:', {
        logId: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        riskScore: riskAssessment.riskScore,
        recommendation: riskAssessment.recommendation
      });
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }
}

export const securityAuditService = SecurityAuditService.getInstance();
