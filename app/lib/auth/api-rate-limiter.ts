
/**
 * HYBRID SPRINT 2.1: API Rate Limiting Service
 * Advanced rate limiting with user, IP, and endpoint-specific limits
 */

import { PrismaClient } from '@prisma/client';
import { ApiRateLimitConfig, SecurityAction } from '@/lib/types';
import { securityAuditService } from './security-audit-service';

const prisma = new PrismaClient();

export interface RateLimitRule {
  endpoint: string;
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number; // Duration to block in ms after limit exceeded
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private defaultRules: Map<string, RateLimitRule> = new Map();

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    // Authentication endpoints - strict limits
    this.defaultRules.set('/api/auth/signin', {
      endpoint: '/api/auth/signin',
      requests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 30 * 60 * 1000 // 30 minutes block
    });

    this.defaultRules.set('/api/auth/signup', {
      endpoint: '/api/auth/signup',
      requests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 60 * 60 * 1000 // 1 hour block
    });

    // 2FA endpoints
    this.defaultRules.set('/api/auth/2fa/*', {
      endpoint: '/api/auth/2fa/*',
      requests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 15 * 60 * 1000
    });

    // Password reset
    this.defaultRules.set('/api/auth/reset-password', {
      endpoint: '/api/auth/reset-password',
      requests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 2 * 60 * 60 * 1000 // 2 hours block
    });

    // Data export (sensitive operations)
    this.defaultRules.set('/api/*/export', {
      endpoint: '/api/*/export',
      requests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 30 * 60 * 1000
    });

    // General API endpoints
    this.defaultRules.set('/api/*', {
      endpoint: '/api/*',
      requests: 1000,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 5 * 60 * 1000 // 5 minutes block
    });

    // Admin endpoints
    this.defaultRules.set('/api/admin/*', {
      endpoint: '/api/admin/*',
      requests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 15 * 60 * 1000
    });
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(
    endpoint: string,
    userId?: string,
    ipAddress?: string,
    tenantId?: string
  ): Promise<RateLimitResult> {
    try {
      const rule = this.getRuleForEndpoint(endpoint);
      const now = new Date();
      const windowStart = new Date(now.getTime() - rule.windowMs);
      const windowEnd = new Date(now.getTime());

      // Check user-based limit
      if (userId) {
        const userResult = await this.checkUserRateLimit(
          userId, endpoint, rule, windowStart, windowEnd, tenantId
        );
        if (!userResult.allowed) return userResult;
      }

      // Check IP-based limit
      if (ipAddress) {
        const ipResult = await this.checkIpRateLimit(
          ipAddress, endpoint, rule, windowStart, windowEnd, tenantId
        );
        if (!ipResult.allowed) return ipResult;
      }

      // If no limits exceeded, record the request
      await this.recordRequest(userId, ipAddress, endpoint, tenantId);

      return {
        allowed: true,
        limit: rule.requests,
        remaining: rule.requests - 1,
        resetTime: windowEnd
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        limit: 1000,
        remaining: 999,
        resetTime: new Date(Date.now() + 15 * 60 * 1000)
      };
    }
  }

  /**
   * Check user-specific rate limit
   */
  private async checkUserRateLimit(
    userId: string,
    endpoint: string,
    rule: RateLimitRule,
    windowStart: Date,
    windowEnd: Date,
    tenantId?: string
  ): Promise<RateLimitResult> {
    const existingLimit = await prisma.apiRateLimit.findUnique({
      where: {
        userId_endpoint_windowStart: {
          userId,
          endpoint,
          windowStart
        }
      }
    });

    if (existingLimit) {
      if (existingLimit.isBlocked && existingLimit.windowEnd > new Date()) {
        // Still blocked
        const retryAfter = Math.ceil((existingLimit.windowEnd.getTime() - Date.now()) / 1000);
        
        // Log blocked request
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.PERMISSION_DENIED,
          resource: 'api_endpoint',
          resourceId: endpoint,
          details: { reason: 'rate_limit_exceeded', type: 'user' },
          tenantId
        });

        return {
          allowed: false,
          limit: rule.requests,
          remaining: 0,
          resetTime: existingLimit.windowEnd,
          retryAfter
        };
      }

      if (existingLimit.requestCount >= rule.requests) {
        // Block user if block duration is specified
        if (rule.blockDuration) {
          await prisma.apiRateLimit.update({
            where: { id: existingLimit.id },
            data: {
              isBlocked: true,
              windowEnd: new Date(Date.now() + rule.blockDuration)
            }
          });

          // Log rate limit exceeded
          await securityAuditService.logAction({
            userId,
            action: SecurityAction.SUSPICIOUS_ACTIVITY,
            resource: 'api_endpoint',
            resourceId: endpoint,
            details: { 
              reason: 'rate_limit_exceeded',
              requests: existingLimit.requestCount,
              limit: rule.requests
            },
            tenantId
          });

          const retryAfter = Math.ceil(rule.blockDuration / 1000);
          return {
            allowed: false,
            limit: rule.requests,
            remaining: 0,
            resetTime: new Date(Date.now() + rule.blockDuration),
            retryAfter
          };
        }

        return {
          allowed: false,
          limit: rule.requests,
          remaining: 0,
          resetTime: windowEnd
        };
      }

      // Increment counter
      await prisma.apiRateLimit.update({
        where: { id: existingLimit.id },
        data: { requestCount: existingLimit.requestCount + 1 }
      });

      return {
        allowed: true,
        limit: rule.requests,
        remaining: rule.requests - existingLimit.requestCount - 1,
        resetTime: windowEnd
      };
    }

    // Create new rate limit record
    await prisma.apiRateLimit.create({
      data: {
        userId,
        endpoint,
        requestCount: 1,
        windowStart,
        windowEnd,
        tenantId
      }
    });

    return {
      allowed: true,
      limit: rule.requests,
      remaining: rule.requests - 1,
      resetTime: windowEnd
    };
  }

  /**
   * Check IP-specific rate limit
   */
  private async checkIpRateLimit(
    ipAddress: string,
    endpoint: string,
    rule: RateLimitRule,
    windowStart: Date,
    windowEnd: Date,
    tenantId?: string
  ): Promise<RateLimitResult> {
    const existingLimit = await prisma.apiRateLimit.findUnique({
      where: {
        ipAddress_endpoint_windowStart: {
          ipAddress,
          endpoint,
          windowStart
        }
      }
    });

    if (existingLimit) {
      if (existingLimit.isBlocked && existingLimit.windowEnd > new Date()) {
        // Still blocked
        const retryAfter = Math.ceil((existingLimit.windowEnd.getTime() - Date.now()) / 1000);
        
        // Log blocked request
        await securityAuditService.logAction({
          action: SecurityAction.PERMISSION_DENIED,
          resource: 'api_endpoint',
          resourceId: endpoint,
          ipAddress,
          details: { reason: 'rate_limit_exceeded', type: 'ip' },
          tenantId
        });

        return {
          allowed: false,
          limit: rule.requests,
          remaining: 0,
          resetTime: existingLimit.windowEnd,
          retryAfter
        };
      }

      if (existingLimit.requestCount >= rule.requests) {
        // Block IP if block duration is specified
        if (rule.blockDuration) {
          await prisma.apiRateLimit.update({
            where: { id: existingLimit.id },
            data: {
              isBlocked: true,
              windowEnd: new Date(Date.now() + rule.blockDuration)
            }
          });

          // Log rate limit exceeded
          await securityAuditService.logAction({
            action: SecurityAction.SUSPICIOUS_ACTIVITY,
            resource: 'api_endpoint',
            resourceId: endpoint,
            ipAddress,
            details: { 
              reason: 'rate_limit_exceeded',
              requests: existingLimit.requestCount,
              limit: rule.requests
            },
            tenantId
          });

          const retryAfter = Math.ceil(rule.blockDuration / 1000);
          return {
            allowed: false,
            limit: rule.requests,
            remaining: 0,
            resetTime: new Date(Date.now() + rule.blockDuration),
            retryAfter
          };
        }

        return {
          allowed: false,
          limit: rule.requests,
          remaining: 0,
          resetTime: windowEnd
        };
      }

      // Increment counter
      await prisma.apiRateLimit.update({
        where: { id: existingLimit.id },
        data: { requestCount: existingLimit.requestCount + 1 }
      });

      return {
        allowed: true,
        limit: rule.requests,
        remaining: rule.requests - existingLimit.requestCount - 1,
        resetTime: windowEnd
      };
    }

    // Create new rate limit record
    await prisma.apiRateLimit.create({
      data: {
        ipAddress,
        endpoint,
        requestCount: 1,
        windowStart,
        windowEnd,
        tenantId
      }
    });

    return {
      allowed: true,
      limit: rule.requests,
      remaining: rule.requests - 1,
      resetTime: windowEnd
    };
  }

  /**
   * Record successful request
   */
  private async recordRequest(
    userId?: string,
    ipAddress?: string,
    endpoint?: string,
    tenantId?: string
  ): Promise<void> {
    // This could be used for analytics and monitoring
    // For now, just log successful API usage
  }

  /**
   * Get appropriate rule for endpoint
   */
  private getRuleForEndpoint(endpoint: string): RateLimitRule {
    // Try exact match first
    if (this.defaultRules.has(endpoint)) {
      return this.defaultRules.get(endpoint)!;
    }

    // Try pattern matching
    for (const [pattern, rule] of this.defaultRules.entries()) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(endpoint)) {
          return rule;
        }
      }
    }

    // Default rule
    return {
      endpoint: '/api/*',
      requests: 1000,
      windowMs: 15 * 60 * 1000,
      blockDuration: 5 * 60 * 1000
    };
  }

  /**
   * Clean expired rate limit records
   */
  async cleanExpiredRecords(): Promise<void> {
    try {
      const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      await prisma.apiRateLimit.deleteMany({
        where: {
          windowEnd: {
            lt: expiredThreshold
          }
        }
      });
    } catch (error) {
      console.error('Failed to clean expired rate limit records:', error);
    }
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(tenantId?: string): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topEndpoints: Array<{
      endpoint: string;
      requestCount: number;
      blockCount: number;
    }>;
    topIPs: Array<{
      ipAddress: string;
      requestCount: number;
      blockCount: number;
    }>;
  }> {
    try {
      const where = tenantId ? { tenantId } : {};
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [totalRequests, blockedRequests, endpointStats, ipStats] = await Promise.all([
        prisma.apiRateLimit.aggregate({
          where: { ...where, windowStart: { gte: last24Hours } },
          _sum: { requestCount: true }
        }),
        prisma.apiRateLimit.count({
          where: { ...where, isBlocked: true, windowStart: { gte: last24Hours } }
        }),
        prisma.apiRateLimit.groupBy({
          by: ['endpoint'],
          where: { ...where, windowStart: { gte: last24Hours } },
          _sum: { requestCount: true },
          _count: { isBlocked: true },
          orderBy: { _sum: { requestCount: 'desc' } },
          take: 10
        }),
        prisma.apiRateLimit.groupBy({
          by: ['ipAddress'],
          where: { 
            ...where, 
            ipAddress: { not: null },
            windowStart: { gte: last24Hours }
          },
          _sum: { requestCount: true },
          _count: { isBlocked: true },
          orderBy: { _sum: { requestCount: 'desc' } },
          take: 10
        })
      ]);

      return {
        totalRequests: totalRequests._sum.requestCount || 0,
        blockedRequests,
        topEndpoints: endpointStats.map(stat => ({
          endpoint: stat.endpoint,
          requestCount: stat._sum.requestCount || 0,
          blockCount: stat._count.isBlocked || 0
        })),
        topIPs: ipStats.map(stat => ({
          ipAddress: stat.ipAddress!,
          requestCount: stat._sum.requestCount || 0,
          blockCount: stat._count.isBlocked || 0
        }))
      };
    } catch (error) {
      console.error('Failed to get rate limit statistics:', error);
      return {
        totalRequests: 0,
        blockedRequests: 0,
        topEndpoints: [],
        topIPs: []
      };
    }
  }

  /**
   * Unblock user or IP
   */
  async unblock(userId?: string, ipAddress?: string): Promise<boolean> {
    try {
      const where: any = {};
      if (userId) where.userId = userId;
      if (ipAddress) where.ipAddress = ipAddress;

      await prisma.apiRateLimit.updateMany({
        where: { ...where, isBlocked: true },
        data: { isBlocked: false }
      });

      return true;
    } catch (error) {
      console.error('Failed to unblock:', error);
      return false;
    }
  }
}

export const apiRateLimiter = ApiRateLimiter.getInstance();
