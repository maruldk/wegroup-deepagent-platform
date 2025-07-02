
import { redis } from './redis-client';
import { CacheKeys, CacheTTL } from './cache-keys';

export class CacheService {
  
  // Generic cache wrapper with fallback
  static async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    try {
      await redis.set(key, data, ttl);
    } catch (error) {
      console.warn('Cache write error:', error);
    }
    
    return data;
  }

  // Dashboard specific caching
  static async getDashboards(tenantId: string, userId: string, fetchFn: () => Promise<any>) {
    const key = CacheKeys.DASHBOARD_LIST(tenantId, userId);
    return this.cached(key, fetchFn, CacheTTL.MEDIUM);
  }

  static async getDashboard(dashboardId: string, fetchFn: () => Promise<any>) {
    const key = CacheKeys.DASHBOARD_DETAIL(dashboardId);
    return this.cached(key, fetchFn, CacheTTL.LONG);
  }

  // Analytics specific caching
  static async getAnalyticsMetrics(tenantId: string, fetchFn: () => Promise<any>) {
    const key = CacheKeys.ANALYTICS_METRICS(tenantId);
    return this.cached(key, fetchFn, CacheTTL.SHORT);
  }

  static async getAnalyticsKPI(tenantId: string, period: string, fetchFn: () => Promise<any>) {
    const key = CacheKeys.ANALYTICS_KPI(tenantId, period);
    return this.cached(key, fetchFn, CacheTTL.MEDIUM);
  }

  // AI/ML specific caching
  static async getAIInsights(tenantId: string, type: string, fetchFn: () => Promise<any>) {
    const key = CacheKeys.AI_INSIGHTS(tenantId, type);
    return this.cached(key, fetchFn, CacheTTL.LONG);
  }

  // Cache invalidation helpers
  static async invalidateDashboard(dashboardId: string, tenantId: string) {
    try {
      await Promise.all([
        redis.del(CacheKeys.DASHBOARD_DETAIL(dashboardId)),
        redis.del(CacheKeys.DASHBOARD_WIDGETS(dashboardId)),
        redis.flushPattern(`dashboard:list:${tenantId}:*`),
      ]);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  static async invalidateAnalytics(tenantId: string) {
    try {
      await Promise.all([
        redis.flushPattern(`analytics:*:${tenantId}:*`),
        redis.flushPattern(`ai:*:${tenantId}:*`),
      ]);
    } catch (error) {
      console.warn('Analytics cache invalidation error:', error);
    }
  }

  static async invalidateUser(userId: string, tenantId?: string) {
    try {
      const patterns = [
        `user:*:${userId}`,
        `dashboard:list:${tenantId}:${userId}`,
      ];
      
      if (tenantId) {
        patterns.push(`user:permissions:${userId}:${tenantId}`);
      }

      await Promise.all(patterns.map(pattern => redis.flushPattern(pattern)));
    } catch (error) {
      console.warn('User cache invalidation error:', error);
    }
  }
}
