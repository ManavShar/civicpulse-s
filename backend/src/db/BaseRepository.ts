import { PoolClient } from "pg";
import db from "./connection";
import {
  WhereCondition,
  OrderBy,
  PaginationOptions,
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  rowToCamelCase,
  objectToSnakeCase,
} from "./queryBuilder";
import logger from "../utils/logger";

/**
 * Base repository class with common CRUD operations
 * All specific repositories should extend this class
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected idField: string;

  constructor(tableName: string, idField: string = "id") {
    this.tableName = tableName;
    this.idField = idField;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string | number, client?: PoolClient): Promise<T | null> {
    try {
      const { query, params } = buildSelectQuery(
        this.tableName,
        ["*"],
        [{ field: this.idField, operator: "=", value: id }]
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(rows[0]);
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID`, {
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find all records matching conditions
   */
  async findAll(
    conditions: WhereCondition[] = [],
    orderBy: OrderBy[] = [],
    pagination?: PaginationOptions,
    client?: PoolClient
  ): Promise<T[]> {
    try {
      const { query, params } = buildSelectQuery(
        this.tableName,
        ["*"],
        conditions,
        orderBy,
        pagination
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find a single record matching conditions
   */
  async findOne(
    conditions: WhereCondition[],
    client?: PoolClient
  ): Promise<T | null> {
    try {
      const { query, params } = buildSelectQuery(
        this.tableName,
        ["*"],
        conditions,
        [],
        { limit: 1 }
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(rows[0]);
    } catch (error) {
      logger.error(`Error finding one ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, client?: PoolClient): Promise<T> {
    try {
      const snakeCaseData = objectToSnakeCase(data as Record<string, any>);
      const { query, params } = buildInsertQuery(this.tableName, snakeCaseData);

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      logger.info(`Created ${this.tableName}`, {
        id: rows[0][this.idField],
      });

      return this.mapRowToEntity(rows[0]);
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string | number,
    data: Partial<T>,
    client?: PoolClient
  ): Promise<T | null> {
    try {
      const snakeCaseData = objectToSnakeCase(data as Record<string, any>);
      const { query, params } = buildUpdateQuery(
        this.tableName,
        snakeCaseData,
        [{ field: this.idField, operator: "=", value: id }]
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      if (rows.length === 0) {
        return null;
      }

      logger.info(`Updated ${this.tableName}`, {
        id: rows[0][this.idField],
      });

      return this.mapRowToEntity(rows[0]);
    } catch (error) {
      logger.error(`Error updating ${this.tableName}`, {
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Update records matching conditions
   */
  async updateWhere(
    conditions: WhereCondition[],
    data: Partial<T>,
    client?: PoolClient
  ): Promise<T[]> {
    try {
      const snakeCaseData = objectToSnakeCase(data as Record<string, any>);
      const { query, params } = buildUpdateQuery(
        this.tableName,
        snakeCaseData,
        conditions
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      logger.info(`Updated ${rows.length} ${this.tableName} records`);

      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error(`Error updating ${this.tableName} where`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string | number, client?: PoolClient): Promise<boolean> {
    try {
      const { query, params } = buildDeleteQuery(this.tableName, [
        { field: this.idField, operator: "=", value: id },
      ]);

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      logger.info(`Deleted ${this.tableName}`, {
        id,
        deleted: rows.length > 0,
      });

      return rows.length > 0;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}`, {
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Delete records matching conditions
   */
  async deleteWhere(
    conditions: WhereCondition[],
    client?: PoolClient
  ): Promise<number> {
    try {
      const { query, params } = buildDeleteQuery(this.tableName, conditions);

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      logger.info(`Deleted ${rows.length} ${this.tableName} records`);

      return rows.length;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName} where`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Count records matching conditions
   */
  async count(
    conditions: WhereCondition[] = [],
    client?: PoolClient
  ): Promise<number> {
    try {
      const { query, params } = buildSelectQuery(
        this.tableName,
        ["COUNT(*) as count"],
        conditions
      );

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }

      return parseInt(rows[0].count, 10);
    } catch (error) {
      logger.error(`Error counting ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(
    conditions: WhereCondition[],
    client?: PoolClient
  ): Promise<boolean> {
    const count = await this.count(conditions, client);
    return count > 0;
  }

  /**
   * Execute a raw query
   */
  async query<R = any>(
    query: string,
    params: any[] = [],
    client?: PoolClient
  ): Promise<R[]> {
    try {
      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await db.query(query, params);
      }
      return rows as R[];
    } catch (error) {
      logger.error(`Error executing raw query on ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Map database row to entity
   * Override this method in subclasses for custom mapping
   */
  protected mapRowToEntity(row: any): T {
    return rowToCamelCase<T>(row);
  }

  /**
   * Execute a function within a transaction
   */
  async transaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    return db.transaction(callback);
  }
}
