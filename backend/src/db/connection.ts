// Load environment variables first
import "../config/env";
import { Pool, PoolClient, PoolConfig } from "pg";
import logger from "../utils/logger";

/**
 * Database connection pool configuration
 */
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
};

/**
 * PostgreSQL connection pool singleton
 */
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(poolConfig);

    // Log pool errors
    this.pool.on("error", (err) => {
      logger.error("Unexpected database pool error", {
        error: err.message,
        stack: err.stack,
      });
    });

    // Log pool connection
    this.pool.on("connect", () => {
      logger.debug("New database connection established");
    });

    // Log pool removal
    this.pool.on("remove", () => {
      logger.debug("Database connection removed from pool");
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Get the connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a query with automatic connection management
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug("Executed query", {
        text: text.substring(0, 100), // Log first 100 chars
        duration,
        rows: result.rowCount,
      });

      return result.rows as T[];
    } catch (error) {
      logger.error("Database query error", {
        error: error instanceof Error ? error.message : "Unknown error",
        query: text.substring(0, 100),
        params,
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transaction support
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute a function within a transaction
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction rolled back", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.pool.query("SELECT NOW()");
      logger.info("Database connection test successful");
      return true;
    } catch (error) {
      logger.error("Database connection test failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Close all connections in the pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
    logger.info("Database connection pool closed");
  }
}

// Export singleton instance
export const db = Database.getInstance();
export default db;
