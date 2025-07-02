
import Redis from 'ioredis';

class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected = false;

  static getInstance(): Redis | null {
    if (!RedisClient.instance) {
      try {
        RedisClient.instance = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        RedisClient.instance.on('connect', () => {
          console.log('✅ Redis connected successfully');
          RedisClient.isConnected = true;
        });

        RedisClient.instance.on('error', (error) => {
          console.warn('⚠️ Redis connection error:', error.message);
          RedisClient.isConnected = false;
        });

        RedisClient.instance.on('close', () => {
          console.log('🔄 Redis connection closed');
          RedisClient.isConnected = false;
        });

      } catch (error) {
        console.warn('⚠️ Redis client initialization failed:', error);
        return null;
      }
    }
    return RedisClient.instance;
  }

  static isReady(): boolean {
    return RedisClient.isConnected && RedisClient.instance?.status === 'ready';
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      if (!RedisClient.isReady()) return null;
      
      const cached = await RedisClient.getInstance()?.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      if (!RedisClient.isReady()) return false;
      
      const result = await RedisClient.getInstance()?.setex(key, ttlSeconds, JSON.stringify(value));
      return result === 'OK';
    } catch (error) {
      console.warn(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      if (!RedisClient.isReady()) return false;
      
      const result = await RedisClient.getInstance()?.del(key);
      return (result ?? 0) > 0;
    } catch (error) {
      console.warn(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      if (!RedisClient.isReady()) return false;
      
      const result = await RedisClient.getInstance()?.exists(key);
      return (result ?? 0) > 0;
    } catch (error) {
      console.warn(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  static async flushPattern(pattern: string): Promise<void> {
    try {
      if (!RedisClient.isReady()) return;
      
      const redis = RedisClient.getInstance();
      if (!redis) return;

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn(`Redis FLUSH pattern error for ${pattern}:`, error);
    }
  }
}

export const redis = RedisClient;
