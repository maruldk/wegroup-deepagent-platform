
import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  defaultTTL: number;
  maxMemory: string;
  evictionPolicy: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu';
  keyPrefix: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  totalKeys: number;
  memoryUsage: number;
  evictions: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
  };
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export class CacheService {
  private redisClient: RedisClientType | null = null;
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRatio: 0,
    totalKeys: 0,
    memoryUsage: 0,
    evictions: 0,
    operations: { gets: 0, sets: 0, deletes: 0 }
  };
  
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxMemory: '128mb',
    evictionPolicy: 'allkeys-lru',
    keyPrefix: 'wegroup:cache:'
  };

  private readonly MAX_LOCAL_CACHE_SIZE = 1000;
  private readonly METRICS_UPDATE_INTERVAL = 30000; // 30 seconds

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeRedis();
    this.startMetricsCollection();
  }

  /**
   * Initialize Redis Connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
          }
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
          // Fallback to local cache
          this.redisClient = null;
        });

        this.redisClient.on('connect', () => {
          console.log('Redis Client Connected');
        });

        await this.redisClient.connect();
        
        // Configure Redis
        await this.configureRedis();
      } else {
        console.warn('Redis URL not provided, using local cache only');
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redisClient = null;
    }
  }

  /**
   * Configure Redis Settings
   */
  private async configureRedis(): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.configSet('maxmemory', this.config.maxMemory);
      await this.redisClient.configSet('maxmemory-policy', this.config.evictionPolicy);
    } catch (error) {
      console.error('Failed to configure Redis:', error);
    }
  }

  /**
   * Get Value from Cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    this.metrics.operations.gets++;

    try {
      // Try Redis first
      if (this.redisClient) {
        const redisValue = await this.redisClient.get(fullKey);
        if (redisValue) {
          this.metrics.hits++;
          this.updateHitRatio();
          
          try {
            const parsed = JSON.parse(redisValue);
            // Update local cache with Redis data
            this.setLocalCache(fullKey, parsed, this.config.defaultTTL);
            return parsed;
          } catch (parseError) {
            console.error('Failed to parse Redis value:', parseError);
            return redisValue as T;
          }
        }
      }

      // Try local cache
      const localValue = this.getLocalCache<T>(fullKey);
      if (localValue !== null) {
        this.metrics.hits++;
        this.updateHitRatio();
        return localValue;
      }

      // Cache miss
      this.metrics.misses++;
      this.updateHitRatio();
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      this.updateHitRatio();
      return null;
    }
  }

  /**
   * Set Value in Cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const cacheTTL = ttl || this.config.defaultTTL;
    this.metrics.operations.sets++;

    try {
      const serializedValue = JSON.stringify(value);

      // Set in Redis
      if (this.redisClient) {
        const redisResult = await this.redisClient.setEx(
          fullKey,
          Math.floor(cacheTTL / 1000), // Redis expects seconds
          serializedValue
        );
        
        if (redisResult === 'OK') {
          // Also set in local cache
          this.setLocalCache(fullKey, value, cacheTTL);
          this.metrics.totalKeys++;
          return true;
        }
      }

      // Set in local cache only
      this.setLocalCache(fullKey, value, cacheTTL);
      this.metrics.totalKeys++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete Value from Cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    this.metrics.operations.deletes++;

    try {
      let redisDeleted = false;
      let localDeleted = false;

      // Delete from Redis
      if (this.redisClient) {
        const redisResult = await this.redisClient.del(fullKey);
        redisDeleted = redisResult > 0;
      }

      // Delete from local cache
      localDeleted = this.localCache.delete(fullKey);

      if (redisDeleted || localDeleted) {
        this.metrics.totalKeys = Math.max(0, this.metrics.totalKeys - 1);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if Key Exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    try {
      // Check Redis first
      if (this.redisClient) {
        const exists = await this.redisClient.exists(fullKey);
        if (exists) return true;
      }

      // Check local cache
      return this.localCache.has(fullKey);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Clear Cache (Pattern-based or All)
   */
  async clear(pattern?: string): Promise<number> {
    let clearedCount = 0;

    try {
      if (pattern) {
        const fullPattern = this.getFullKey(pattern);
        
        // Clear from Redis
        if (this.redisClient) {
          const keys = await this.redisClient.keys(fullPattern);
          if (keys.length > 0) {
            const deleted = await this.redisClient.del(keys);
            clearedCount += deleted;
          }
        }

        // Clear from local cache
        for (const [key] of this.localCache) {
          if (key.includes(fullPattern)) {
            this.localCache.delete(key);
            clearedCount++;
          }
        }
      } else {
        // Clear all
        if (this.redisClient) {
          await this.redisClient.flushDb();
        }
        
        clearedCount = this.localCache.size;
        this.localCache.clear();
      }

      this.metrics.totalKeys = Math.max(0, this.metrics.totalKeys - clearedCount);
      return clearedCount;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get Multiple Values (Batch Get)
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const fullKeys = keys.map(key => this.getFullKey(key));
    this.metrics.operations.gets += keys.length;

    try {
      // Try Redis first for batch get
      if (this.redisClient) {
        const redisValues = await this.redisClient.mGet(fullKeys);
        const results: Array<T | null> = [];
        
        for (let i = 0; i < redisValues.length; i++) {
          if (redisValues[i]) {
            try {
              const parsed = JSON.parse(redisValues[i]!);
              results.push(parsed);
              this.metrics.hits++;
              // Update local cache
              this.setLocalCache(fullKeys[i], parsed, this.config.defaultTTL);
            } catch (parseError) {
              results.push(redisValues[i] as T);
              this.metrics.hits++;
            }
          } else {
            // Try local cache
            const localValue = this.getLocalCache<T>(fullKeys[i]);
            if (localValue !== null) {
              results.push(localValue);
              this.metrics.hits++;
            } else {
              results.push(null);
              this.metrics.misses++;
            }
          }
        }
        
        this.updateHitRatio();
        return results;
      }

      // Fallback to local cache
      const results: Array<T | null> = [];
      for (const fullKey of fullKeys) {
        const value = this.getLocalCache<T>(fullKey);
        results.push(value);
        if (value !== null) {
          this.metrics.hits++;
        } else {
          this.metrics.misses++;
        }
      }
      
      this.updateHitRatio();
      return results;
    } catch (error) {
      console.error('Cache mget error:', error);
      this.metrics.misses += keys.length;
      this.updateHitRatio();
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Set Multiple Values (Batch Set)
   */
  async mset<T>(keyValues: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    this.metrics.operations.sets += keyValues.length;

    try {
      // Batch set in Redis if available
      if (this.redisClient) {
        const pipeline = this.redisClient.multi();
        
        keyValues.forEach(({ key, value, ttl }) => {
          const fullKey = this.getFullKey(key);
          const serializedValue = JSON.stringify(value);
          const cacheTTL = Math.floor((ttl || this.config.defaultTTL) / 1000);
          
          pipeline.setEx(fullKey, cacheTTL, serializedValue);
        });
        
        await pipeline.exec();
      }

      // Set in local cache
      keyValues.forEach(({ key, value, ttl }) => {
        const fullKey = this.getFullKey(key);
        this.setLocalCache(fullKey, value, ttl || this.config.defaultTTL);
      });

      this.metrics.totalKeys += keyValues.length;
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Cached Function Execution
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error('Cached function execution failed:', error);
      throw error;
    }
  }

  /**
   * Get Cache Statistics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset Cache Statistics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalKeys: 0,
      memoryUsage: 0,
      evictions: 0,
      operations: { gets: 0, sets: 0, deletes: 0 }
    };
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<{
    redis: boolean;
    localCache: boolean;
    metrics: CacheMetrics;
  }> {
    let redisHealthy = false;
    
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        redisHealthy = true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return {
      redis: redisHealthy,
      localCache: true,
      metrics: this.getMetrics()
    };
  }

  /**
   * Close Connections
   */
  async close(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
      }
      this.localCache.clear();
    } catch (error) {
      console.error('Error closing cache service:', error);
    }
  }

  /**
   * Private Helper Methods
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private getLocalCache<T>(key: string): T | null {
    const entry = this.localCache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.localCache.delete(key);
      this.metrics.evictions++;
      return null;
    }

    // Update access time and hit count
    entry.lastAccessed = Date.now();
    entry.hits++;
    
    return entry.value;
  }

  private setLocalCache<T>(key: string, value: T, ttl: number): void {
    // Check if we need to evict entries
    if (this.localCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      this.evictLocalCacheEntries();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now()
    };

    this.localCache.set(key, entry);
  }

  private evictLocalCacheEntries(): void {
    // Remove expired entries first
    const now = Date.now();
    for (const [key, entry] of this.localCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.localCache.delete(key);
        this.metrics.evictions++;
      }
    }

    // If still too many entries, remove least recently used
    if (this.localCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      const entries = Array.from(this.localCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = Math.floor(this.MAX_LOCAL_CACHE_SIZE * 0.2); // Remove 20%
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.localCache.delete(entries[i][0]);
        this.metrics.evictions++;
      }
    }
  }

  private updateHitRatio(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRatio = total > 0 ? this.metrics.hits / total : 0;
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMemoryUsage();
      this.cleanupExpiredEntries();
    }, this.METRICS_UPDATE_INTERVAL);
  }

  private updateMemoryUsage(): void {
    // Estimate memory usage of local cache
    let memoryUsage = 0;
    for (const [key, entry] of this.localCache) {
      memoryUsage += key.length * 2; // UTF-16 encoding
      memoryUsage += JSON.stringify(entry.value).length * 2;
      memoryUsage += 64; // Estimated overhead per entry
    }
    this.metrics.memoryUsage = memoryUsage;
    this.metrics.totalKeys = this.localCache.size;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.localCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.localCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.metrics.evictions += cleanedCount;
      this.metrics.totalKeys = this.localCache.size;
    }
  }

  /**
   * Advanced Cache Operations
   */

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.redisClient) {
        return await this.redisClient.incrBy(fullKey, delta);
      }

      // Local cache implementation
      const current = await this.get<number>(key) || 0;
      const newValue = current + delta;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Set expiration time for existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.redisClient) {
        const result = await this.redisClient.expire(fullKey, Math.floor(ttl / 1000));
        return result;
      }

      // Local cache implementation
      const entry = this.localCache.get(fullKey);
      if (entry) {
        entry.ttl = ttl;
        entry.timestamp = Date.now(); // Reset timestamp for new TTL
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.redisClient) {
        return await this.redisClient.ttl(fullKey);
      }

      // Local cache implementation
      const entry = this.localCache.get(fullKey);
      if (entry) {
        const remaining = entry.ttl - (Date.now() - entry.timestamp);
        return Math.max(0, Math.floor(remaining / 1000));
      }
      return -2; // Key doesn't exist
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1; // Error
    }
  }

  /**
   * Add to a set (Redis-like operation)
   */
  async sadd(key: string, ...values: string[]): Promise<number> {
    try {
      if (this.redisClient) {
        return await this.redisClient.sAdd(this.getFullKey(key), values);
      }

      // Local cache implementation using Set
      const set = await this.get<string[]>(key) || [];
      const currentSet = new Set(set);
      let added = 0;
      
      values.forEach(value => {
        if (!currentSet.has(value)) {
          currentSet.add(value);
          added++;
        }
      });
      
      await this.set(key, Array.from(currentSet));
      return added;
    } catch (error) {
      console.error('Cache sadd error:', error);
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      if (this.redisClient) {
        return await this.redisClient.sMembers(this.getFullKey(key));
      }

      // Local cache implementation
      return await this.get<string[]>(key) || [];
    } catch (error) {
      console.error('Cache smembers error:', error);
      return [];
    }
  }

  /**
   * Tag-based Cache Invalidation
   */
  private taggedKeys: Map<string, Set<string>> = new Map();

  async setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): Promise<boolean> {
    const result = await this.set(key, value, ttl);
    
    if (result) {
      // Associate key with tags
      tags.forEach(tag => {
        if (!this.taggedKeys.has(tag)) {
          this.taggedKeys.set(tag, new Set());
        }
        this.taggedKeys.get(tag)!.add(key);
      });
    }
    
    return result;
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.taggedKeys.get(tag);
    if (!keys) return 0;

    let invalidated = 0;
    for (const key of keys) {
      const deleted = await this.delete(key);
      if (deleted) invalidated++;
    }

    // Clean up tag mapping
    this.taggedKeys.delete(tag);
    
    return invalidated;
  }

  /**
   * Distributed Locking (Redis only)
   */
  async acquireLock(lockKey: string, ttl: number = 10000): Promise<string | null> {
    if (!this.redisClient) {
      console.warn('Distributed locking requires Redis');
      return null;
    }

    try {
      const lockValue = `${Date.now()}-${Math.random()}`;
      const fullKey = this.getFullKey(`lock:${lockKey}`);
      
      const result = await this.redisClient.set(fullKey, lockValue, {
        PX: ttl, // TTL in milliseconds
        NX: true // Only set if not exists
      });
      
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return null;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const fullKey = this.getFullKey(`lock:${lockKey}`);
      
      // Lua script to atomically check and delete
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redisClient.eval(luaScript, {
        keys: [fullKey],
        arguments: [lockValue]
      });
      
      return result === 1;
    } catch (error) {
      console.error('Lock release error:', error);
      return false;
    }
  }
}
