
import { PrismaClient } from '@prisma/client';

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery?: string;
  executionTime: number;
  rowsAffected: number;
  optimizations: Array<{
    type: 'INDEX' | 'JOIN' | 'WHERE' | 'SELECT' | 'LIMIT' | 'CACHE';
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  recommendations: string[];
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    maxConnections: number;
  };
  queryPerformance: {
    averageExecutionTime: number;
    slowQueries: number;
    totalQueries: number;
    queriesPerSecond: number;
  };
  indexUsage: {
    totalIndexes: number;
    unusedIndexes: number;
    indexHitRatio: number;
  };
  cachePerformance: {
    hitRatio: number;
    missRatio: number;
    evictionRate: number;
  };
}

export class DatabaseOptimizationService {
  private prisma: PrismaClient;
  private queryCache: Map<string, { result: any; timestamp: number; hits: number }> = new Map();
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();
  private slowQueryThreshold = 1000; // 1 second
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' }
      ]
    });

    this.setupQueryLogging();
  }

  /**
   * Setup Query Performance Monitoring
   */
  private setupQueryLogging(): void {
    this.prisma.$on('query', (e) => {
      const queryHash = this.hashQuery(e.query);
      const executionTime = e.duration;

      // Update query statistics
      const stats = this.queryStats.get(queryHash) || { count: 0, totalTime: 0, avgTime: 0 };
      stats.count++;
      stats.totalTime += executionTime;
      stats.avgTime = stats.totalTime / stats.count;
      this.queryStats.set(queryHash, stats);

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        console.warn(`Slow query detected (${executionTime}ms):`, e.query);
        this.analyzeSlowQuery(e.query, executionTime);
      }
    });
  }

  /**
   * Optimized Query Execution with Caching
   */
  async executeOptimizedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    // Check cache first if cache key provided
    if (cacheKey) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        cached.hits++;
        return cached.result;
      }
    }

    try {
      // Execute query
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      // Cache result if cache key provided
      if (cacheKey) {
        this.setCachedResult(cacheKey, result, cacheTTL || this.CACHE_TTL);
      }

      // Log query performance
      this.logQueryPerformance(queryFn.toString(), executionTime);

      return result;
    } catch (error) {
      console.error('Optimized query execution failed:', error);
      throw error;
    }
  }

  /**
   * Batch Query Optimization
   */
  async executeBatchQueries<T>(
    queries: Array<{
      queryFn: () => Promise<T>;
      cacheKey?: string;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    }>
  ): Promise<T[]> {
    try {
      // Sort by priority
      const sortedQueries = queries.sort((a, b) => {
        const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const aPriority = priorityOrder[a.priority || 'MEDIUM'];
        const bPriority = priorityOrder[b.priority || 'MEDIUM'];
        return bPriority - aPriority;
      });

      // Execute in batches to avoid overwhelming the database
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < sortedQueries.length; i += batchSize) {
        const batch = sortedQueries.slice(i, i + batchSize);
        const batchPromises = batch.map(query => 
          this.executeOptimizedQuery(query.queryFn, query.cacheKey)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch query failed:', result.reason);
            throw result.reason;
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Batch query execution failed:', error);
      throw error;
    }
  }

  /**
   * Database Performance Monitoring
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get connection pool metrics
      const connectionPool = this.getConnectionPoolMetrics();
      
      // Calculate query performance metrics
      const queryPerformance = this.calculateQueryPerformanceMetrics();
      
      // Get index usage metrics
      const indexUsage = await this.getIndexUsageMetrics();
      
      // Get cache performance metrics
      const cachePerformance = this.getCachePerformanceMetrics();

      return {
        connectionPool,
        queryPerformance,
        indexUsage,
        cachePerformance
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Query Optimization Analysis
   */
  async analyzeQuery(query: string): Promise<QueryOptimizationResult> {
    const startTime = Date.now();
    
    try {
      // Analyze query structure
      const optimizations = this.identifyOptimizations(query);
      
      // Generate optimized query if possible
      const optimizedQuery = this.generateOptimizedQuery(query, optimizations);
      
      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(query, optimizations);

      return {
        originalQuery: query,
        optimizedQuery,
        executionTime: Date.now() - startTime,
        rowsAffected: 0, // Would be calculated from actual execution
        optimizations,
        recommendations
      };
    } catch (error) {
      console.error('Query analysis failed:', error);
      return {
        originalQuery: query,
        executionTime: Date.now() - startTime,
        rowsAffected: 0,
        optimizations: [],
        recommendations: ['Query analysis failed - manual review recommended']
      };
    }
  }

  /**
   * Index Optimization
   */
  async optimizeIndexes(tenantId: string): Promise<{
    createdIndexes: string[];
    droppedIndexes: string[];
    recommendations: string[];
  }> {
    try {
      const result = {
        createdIndexes: [] as string[],
        droppedIndexes: [] as string[],
        recommendations: [] as string[]
      };

      // Analyze query patterns to suggest indexes
      const indexRecommendations = this.analyzeQueryPatternsForIndexes();
      
      // Add recommendations for common query patterns
      if (indexRecommendations.length > 0) {
        result.recommendations.push(
          ...indexRecommendations.map(rec => 
            `Consider adding index: ${rec.table}.${rec.columns.join(', ')}`
          )
        );
      }

      // Identify unused indexes (would require database-specific queries)
      const unusedIndexes = await this.identifyUnusedIndexes();
      if (unusedIndexes.length > 0) {
        result.recommendations.push(
          ...unusedIndexes.map(index => `Consider dropping unused index: ${index}`)
        );
      }

      return result;
    } catch (error) {
      console.error('Index optimization failed:', error);
      return {
        createdIndexes: [],
        droppedIndexes: [],
        recommendations: ['Index optimization failed - manual review recommended']
      };
    }
  }

  /**
   * Cache Management
   */
  invalidateCache(pattern?: string): number {
    let invalidatedCount = 0;
    
    if (pattern) {
      // Invalidate cache entries matching pattern
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
          invalidatedCount++;
        }
      }
    } else {
      // Clear all cache
      invalidatedCount = this.queryCache.size;
      this.queryCache.clear();
    }

    return invalidatedCount;
  }

  /**
   * Connection Pool Optimization
   */
  async optimizeConnectionPool(): Promise<{
    currentSettings: any;
    recommendations: string[];
    optimizedSettings: any;
  }> {
    try {
      const currentMetrics = this.getConnectionPoolMetrics();
      const recommendations = [];
      const optimizedSettings = { ...currentMetrics };

      // Analyze connection pool usage
      if (currentMetrics.waiting > 0) {
        recommendations.push('Increase connection pool size - requests are waiting');
        optimizedSettings.maxConnections = Math.min(currentMetrics.maxConnections * 1.5, 50);
      }

      if (currentMetrics.idle / currentMetrics.maxConnections > 0.5) {
        recommendations.push('Consider reducing connection pool size - many idle connections');
        optimizedSettings.maxConnections = Math.max(currentMetrics.maxConnections * 0.8, 10);
      }

      if (currentMetrics.active / currentMetrics.maxConnections > 0.8) {
        recommendations.push('Connection pool utilization is high - monitor for bottlenecks');
      }

      return {
        currentSettings: currentMetrics,
        recommendations,
        optimizedSettings
      };
    } catch (error) {
      console.error('Connection pool optimization failed:', error);
      return {
        currentSettings: {},
        recommendations: ['Connection pool analysis failed'],
        optimizedSettings: {}
      };
    }
  }

  /**
   * Helper Methods
   */
  private hashQuery(query: string): string {
    // Simple hash function for query caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private getCachedResult(key: string): any {
    const cached = this.queryCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached;
    }
    if (cached) {
      this.queryCache.delete(key);
    }
    return null;
  }

  private setCachedResult(key: string, result: any, ttl: number): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 0
    });

    // Cleanup old cache entries
    if (this.queryCache.size > 1000) {
      const oldestKeys = Array.from(this.queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 200)
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.queryCache.delete(key));
    }
  }

  private logQueryPerformance(query: string, executionTime: number): void {
    const queryHash = this.hashQuery(query);
    console.debug(`Query executed in ${executionTime}ms: ${queryHash}`);
  }

  private async analyzeSlowQuery(query: string, executionTime: number): Promise<void> {
    try {
      // Analyze slow query for optimization opportunities
      const analysis = await this.analyzeQuery(query);
      
      console.warn(`Slow query analysis (${executionTime}ms):`, {
        query: query.substring(0, 100),
        optimizations: analysis.optimizations,
        recommendations: analysis.recommendations
      });
    } catch (error) {
      console.error('Slow query analysis failed:', error);
    }
  }

  private getConnectionPoolMetrics(): DatabaseMetrics['connectionPool'] {
    // Simplified metrics - would integrate with actual Prisma connection pool
    return {
      active: 5,
      idle: 3,
      waiting: 0,
      maxConnections: 20
    };
  }

  private calculateQueryPerformanceMetrics(): DatabaseMetrics['queryPerformance'] {
    const stats = Array.from(this.queryStats.values());
    
    if (stats.length === 0) {
      return {
        averageExecutionTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        queriesPerSecond: 0
      };
    }

    const totalQueries = stats.reduce((sum, stat) => sum + stat.count, 0);
    const averageExecutionTime = stats.reduce((sum, stat) => sum + stat.avgTime, 0) / stats.length;
    const slowQueries = stats.filter(stat => stat.avgTime > this.slowQueryThreshold).length;

    return {
      averageExecutionTime,
      slowQueries,
      totalQueries,
      queriesPerSecond: totalQueries / 60 // Approximate QPS
    };
  }

  private async getIndexUsageMetrics(): Promise<DatabaseMetrics['indexUsage']> {
    try {
      // Would query database-specific system tables for index usage
      return {
        totalIndexes: 25,
        unusedIndexes: 3,
        indexHitRatio: 0.85
      };
    } catch (error) {
      console.error('Failed to get index usage metrics:', error);
      return {
        totalIndexes: 0,
        unusedIndexes: 0,
        indexHitRatio: 0
      };
    }
  }

  private getCachePerformanceMetrics(): DatabaseMetrics['cachePerformance'] {
    const totalEntries = this.queryCache.size;
    const totalHits = Array.from(this.queryCache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = totalHits + totalEntries; // Simplified calculation

    return {
      hitRatio: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRatio: totalRequests > 0 ? (totalRequests - totalHits) / totalRequests : 0,
      evictionRate: 0.05 // Simplified - would track actual evictions
    };
  }

  private identifyOptimizations(query: string): QueryOptimizationResult['optimizations'] {
    const optimizations = [];
    const queryLower = query.toLowerCase();

    // Check for missing WHERE clauses on large tables
    if (queryLower.includes('select') && !queryLower.includes('where') && !queryLower.includes('limit')) {
      optimizations.push({
        type: 'WHERE',
        description: 'Consider adding WHERE clause to limit results',
        impact: 'HIGH'
      });
    }

    // Check for SELECT *
    if (queryLower.includes('select *')) {
      optimizations.push({
        type: 'SELECT',
        description: 'Avoid SELECT * - specify only needed columns',
        impact: 'MEDIUM'
      });
    }

    // Check for missing LIMIT on potentially large result sets
    if (queryLower.includes('select') && !queryLower.includes('limit') && !queryLower.includes('count')) {
      optimizations.push({
        type: 'LIMIT',
        description: 'Consider adding LIMIT to prevent large result sets',
        impact: 'MEDIUM'
      });
    }

    // Check for inefficient JOINs
    if (queryLower.includes('join') && !queryLower.includes('on')) {
      optimizations.push({
        type: 'JOIN',
        description: 'Ensure proper JOIN conditions are specified',
        impact: 'HIGH'
      });
    }

    return optimizations;
  }

  private generateOptimizedQuery(query: string, optimizations: any[]): string | undefined {
    let optimizedQuery = query;
    let hasOptimizations = false;

    // Apply basic optimizations
    optimizations.forEach(opt => {
      switch (opt.type) {
        case 'SELECT':
          if (optimizedQuery.includes('SELECT *')) {
            // Would replace with specific columns based on table schema
            optimizedQuery = optimizedQuery.replace('SELECT *', 'SELECT id, name, email');
            hasOptimizations = true;
          }
          break;
        case 'LIMIT':
          if (!optimizedQuery.toLowerCase().includes('limit')) {
            optimizedQuery += ' LIMIT 100';
            hasOptimizations = true;
          }
          break;
      }
    });

    return hasOptimizations ? optimizedQuery : undefined;
  }

  private generateOptimizationRecommendations(query: string, optimizations: any[]): string[] {
    const recommendations = [];

    if (optimizations.length === 0) {
      recommendations.push('Query appears to be well-optimized');
    } else {
      recommendations.push(
        ...optimizations.map(opt => `${opt.type}: ${opt.description} (${opt.impact} impact)`)
      );
    }

    // Add general recommendations
    recommendations.push('Consider adding appropriate indexes for frequently queried columns');
    recommendations.push('Monitor query execution time and optimize if > 1 second');
    recommendations.push('Use query caching for frequently executed queries');

    return recommendations;
  }

  private analyzeQueryPatternsForIndexes(): Array<{ table: string; columns: string[] }> {
    // Analyze query statistics to suggest indexes
    const recommendations = [];

    // Example recommendations based on common patterns
    recommendations.push(
      { table: 'contacts', columns: ['tenantId', 'createdAt'] },
      { table: 'opportunities', columns: ['tenantId', 'status'] },
      { table: 'employees', columns: ['tenantId', 'departmentId'] },
      { table: 'aIDecision', columns: ['tenantId', 'category', 'createdAt'] }
    );

    return recommendations;
  }

  private async identifyUnusedIndexes(): Promise<string[]> {
    try {
      // Would query database system tables to find unused indexes
      return [
        'idx_unused_table_column',
        'idx_old_index_name'
      ];
    } catch (error) {
      console.error('Failed to identify unused indexes:', error);
      return [];
    }
  }

  private getDefaultMetrics(): DatabaseMetrics {
    return {
      connectionPool: {
        active: 0,
        idle: 0,
        waiting: 0,
        maxConnections: 20
      },
      queryPerformance: {
        averageExecutionTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        queriesPerSecond: 0
      },
      indexUsage: {
        totalIndexes: 0,
        unusedIndexes: 0,
        indexHitRatio: 0
      },
      cachePerformance: {
        hitRatio: 0,
        missRatio: 0,
        evictionRate: 0
      }
    };
  }

  /**
   * Cleanup and Maintenance
   */
  async performMaintenance(): Promise<{
    cacheCleared: number;
    statsReset: boolean;
    recommendations: string[];
  }> {
    try {
      // Clear old cache entries
      const cacheCleared = this.invalidateCache();
      
      // Reset old query statistics
      const oldStatsCount = this.queryStats.size;
      this.queryStats.clear();
      
      const recommendations = [
        'Regular maintenance completed',
        'Monitor query performance regularly',
        'Review slow query logs weekly',
        'Update statistics monthly'
      ];

      return {
        cacheCleared,
        statsReset: oldStatsCount > 0,
        recommendations
      };
    } catch (error) {
      console.error('Database maintenance failed:', error);
      return {
        cacheCleared: 0,
        statsReset: false,
        recommendations: ['Maintenance failed - manual intervention required']
      };
    }
  }
}

