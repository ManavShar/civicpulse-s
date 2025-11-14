import { Redis } from "ioredis";
import logger from "../utils/logger";
import { redisClient } from "../db/redis";

/**
 * Cache key prefixes for different data types
 */
export const CachePrefix = {
  SENSOR: "sensor",
  SENSOR_READING: "sensor:reading",
  INCIDENT: "incident",
  PREDICTION: "prediction",
  WORK_ORDER: "workorder",
  ZONE: "zone",
  METRICS: "metrics",
  BASELINE: "baseline",
  SESSION: "session",
} as const;

/**
 * TTL (Time To Live) strategies in seconds
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 1800, // 30 minutes - for slowly changing data
  HOUR: 3600, // 1 hour - for relatively static data
  DAY: 86400, // 24 hours - for very static data
  WEEK: 604800, // 7 days - for historical data
} as const;

/**
 * Cache service for managing Redis operations
 */
export class CacheService {
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.client = redisClient.getClient();
    this.publisher = redisClient.getPublisher();
    this.subscriber = redisClient.getSubscriber();
  }

  /**
   * Generate a cache key with proper naming convention
   * Format: prefix:identifier[:subkey]
   */
  public generateKey(
    prefix: string,
    identifier: string,
    subkey?: string
  ): string {
    const parts = [prefix, identifier];
    if (subkey) {
      parts.push(subkey);
    }
    return parts.join(":");
  }

  /**
   * Get a value from cache
   */
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);

      if (!value) {
        logger.debug("Cache miss", { key });
        return null;
      }

      logger.debug("Cache hit", { key });
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error("Cache get error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  public async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      logger.debug("Cache set", { key, ttl });
      return true;
    } catch (error) {
      logger.error("Cache set error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Delete a specific key from cache
   */
  public async invalidate(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      logger.debug("Cache invalidated", { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error("Cache invalidate error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  public async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        logger.debug("No keys found for pattern", { pattern });
        return 0;
      }

      const result = await this.client.del(...keys);
      logger.debug("Cache pattern invalidated", {
        pattern,
        keysDeleted: result,
      });
      return result;
    } catch (error) {
      logger.error("Cache invalidate pattern error", {
        pattern,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Cache exists check error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const values = await this.client.mget(...keys);

      return values.map((value, index) => {
        if (!value) {
          logger.debug("Cache miss", { key: keys[index] });
          return null;
        }

        try {
          return JSON.parse(value) as T;
        } catch {
          logger.warn("Failed to parse cached value", { key: keys[index] });
          return null;
        }
      });
    } catch (error) {
      logger.error("Cache mget error", {
        keyCount: keys.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  public async mset(
    entries: Record<string, any>,
    ttl?: number
  ): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();

      for (const [key, value] of Object.entries(entries)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
      logger.debug("Cache mset", {
        keyCount: Object.keys(entries).length,
        ttl,
      });
      return true;
    } catch (error) {
      logger.error("Cache mset error", {
        keyCount: Object.keys(entries).length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  public async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.client.incrby(key, amount);
      logger.debug("Cache increment", { key, amount, newValue: result });
      return result;
    } catch (error) {
      logger.error("Cache increment error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Set expiration time for a key
   */
  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error("Cache expire error", {
        key,
        ttl,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error("Cache TTL check error", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return -1;
    }
  }

  // ==================== Pub/Sub Methods ====================

  /**
   * Publish a message to a channel
   */
  public async publish(channel: string, message: any): Promise<number> {
    try {
      const serialized = JSON.stringify(message);
      const subscriberCount = await this.publisher.publish(channel, serialized);

      logger.debug("Message published", {
        channel,
        subscriberCount,
      });

      return subscriberCount;
    } catch (error) {
      logger.error("Publish error", {
        channel,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  /**
   * Subscribe to a channel
   */
  public async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);

      this.subscriber.on("message", (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch (error) {
            logger.error("Failed to parse pub/sub message", {
              channel: ch,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      });

      logger.info("Subscribed to channel", { channel });
    } catch (error) {
      logger.error("Subscribe error", {
        channel,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Subscribe to multiple channels
   */
  public async subscribeMultiple(
    channels: string[],
    callback: (channel: string, message: any) => void
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(...channels);

      this.subscriber.on("message", (channel, message) => {
        try {
          const parsed = JSON.parse(message);
          callback(channel, parsed);
        } catch (error) {
          logger.error("Failed to parse pub/sub message", {
            channel,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

      logger.info("Subscribed to multiple channels", {
        channels,
        count: channels.length,
      });
    } catch (error) {
      logger.error("Subscribe multiple error", {
        channels,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info("Unsubscribed from channel", { channel });
    } catch (error) {
      logger.error("Unsubscribe error", {
        channel,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Pattern-based subscription
   */
  public async psubscribe(
    pattern: string,
    callback: (channel: string, message: any) => void
  ): Promise<void> {
    try {
      await this.subscriber.psubscribe(pattern);

      this.subscriber.on("pmessage", (pat, channel, message) => {
        if (pat === pattern) {
          try {
            const parsed = JSON.parse(message);
            callback(channel, parsed);
          } catch (error) {
            logger.error("Failed to parse pub/sub pattern message", {
              pattern: pat,
              channel,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      });

      logger.info("Subscribed to pattern", { pattern });
    } catch (error) {
      logger.error("Pattern subscribe error", {
        pattern,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Clear all cache (use with caution)
   */
  public async flushAll(): Promise<boolean> {
    try {
      await this.client.flushdb();
      logger.warn("Cache flushed - all keys deleted");
      return true;
    } catch (error) {
      logger.error("Cache flush error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
