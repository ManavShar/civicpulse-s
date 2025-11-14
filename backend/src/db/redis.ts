import Redis, { RedisOptions } from "ioredis";
import logger from "../utils/logger";

/**
 * Redis connection configuration
 */
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}`, { delay });
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

/**
 * Redis client singleton for general operations
 */
class RedisClient {
  private static instance: RedisClient;
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  private constructor() {
    // Main client for general operations
    this.client = new Redis(redisConfig);

    // Dedicated subscriber client for pub/sub
    this.subscriber = new Redis(redisConfig);

    // Dedicated publisher client for pub/sub
    this.publisher = new Redis(redisConfig);

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for Redis connections
   */
  private setupEventHandlers(): void {
    // Main client events
    this.client.on("connect", () => {
      logger.info("Redis client connected");
    });

    this.client.on("ready", () => {
      logger.info("Redis client ready");
    });

    this.client.on("error", (err) => {
      logger.error("Redis client error", {
        error: err.message,
        stack: err.stack,
      });
    });

    this.client.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    this.client.on("reconnecting", () => {
      logger.info("Redis client reconnecting");
    });

    // Subscriber events
    this.subscriber.on("connect", () => {
      logger.info("Redis subscriber connected");
    });

    this.subscriber.on("error", (err) => {
      logger.error("Redis subscriber error", {
        error: err.message,
      });
    });

    // Publisher events
    this.publisher.on("connect", () => {
      logger.info("Redis publisher connected");
    });

    this.publisher.on("error", (err) => {
      logger.error("Redis publisher error", {
        error: err.message,
      });
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Get the main Redis client
   */
  public getClient(): Redis {
    return this.client;
  }

  /**
   * Get the subscriber client
   */
  public getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * Get the publisher client
   */
  public getPublisher(): Redis {
    return this.publisher;
  }

  /**
   * Test Redis connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      logger.info("Redis connection test successful", { result });
      return result === "PONG";
    } catch (error) {
      logger.error("Redis connection test failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Close all Redis connections
   */
  public async close(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
    logger.info("All Redis connections closed");
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();
export default redisClient;
