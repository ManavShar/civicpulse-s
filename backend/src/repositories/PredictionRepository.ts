/**
 * Prediction Repository
 * Data access layer for predictions
 */

import { BaseRepository } from "../db/BaseRepository";
import db from "../db/connection";
import logger from "../utils/logger";

interface Prediction {
  id?: string;
  sensor_id: string;
  predicted_timestamp: Date;
  predicted_value: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  model_version: string;
  horizon_hours?: number;
  created_at?: Date;
}

interface PredictionFilters {
  sensor_id?: string;
  min_confidence?: number;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
}

export class PredictionRepository extends BaseRepository<Prediction> {
  constructor() {
    super("predictions");
  }

  protected mapRowToEntity(row: any): Prediction {
    return {
      id: row.id,
      sensor_id: row.sensor_id,
      predicted_timestamp: row.predicted_timestamp,
      predicted_value: parseFloat(row.predicted_value),
      confidence: parseFloat(row.confidence),
      lower_bound: parseFloat(row.lower_bound),
      upper_bound: parseFloat(row.upper_bound),
      model_version: row.model_version,
      horizon_hours: row.horizon_hours,
      created_at: row.created_at,
    };
  }

  /**
   * Create multiple predictions in a batch
   */
  async createBatch(predictions: Prediction[]): Promise<Prediction[]> {
    if (predictions.length === 0) {
      return [];
    }

    try {
      const values = predictions
        .map(
          (_p, i) =>
            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${
              i * 7 + 5
            }, $${i * 7 + 6}, $${i * 7 + 7})`
        )
        .join(", ");

      const params = predictions.flatMap((p) => [
        p.sensor_id,
        p.predicted_timestamp,
        p.predicted_value,
        p.confidence,
        p.lower_bound,
        p.upper_bound,
        p.model_version,
      ]);

      const query = `
        INSERT INTO predictions (
          sensor_id,
          predicted_timestamp,
          predicted_value,
          confidence,
          lower_bound,
          upper_bound,
          model_version
        )
        VALUES ${values}
        RETURNING *
      `;

      const rows = await db.query(query, params);

      logger.debug(`Created ${rows.length} predictions in batch`);
      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error("Error creating predictions batch:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find predictions by sensor ID
   */
  async findBySensor(
    sensor_id: string,
    limit: number = 100
  ): Promise<Prediction[]> {
    try {
      const query = `
        SELECT *
        FROM predictions
        WHERE sensor_id = $1
        ORDER BY predicted_timestamp DESC
        LIMIT $2
      `;

      const rows = await db.query(query, [sensor_id, limit]);
      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error(`Error finding predictions for sensor ${sensor_id}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find predictions with filters
   */
  async findWithFilters(
    filters: PredictionFilters = {}
  ): Promise<Prediction[]> {
    try {
      let query = "SELECT * FROM predictions WHERE 1=1";
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.sensor_id) {
        query += ` AND sensor_id = $${paramIndex}`;
        params.push(filters.sensor_id);
        paramIndex++;
      }

      if (filters.min_confidence !== undefined) {
        query += ` AND confidence >= $${paramIndex}`;
        params.push(filters.min_confidence);
        paramIndex++;
      }

      if (filters.start_time) {
        query += ` AND predicted_timestamp >= $${paramIndex}`;
        params.push(filters.start_time);
        paramIndex++;
      }

      if (filters.end_time) {
        query += ` AND predicted_timestamp <= $${paramIndex}`;
        params.push(filters.end_time);
        paramIndex++;
      }

      query += " ORDER BY predicted_timestamp DESC";

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      } else {
        query += " LIMIT 100";
      }

      const rows = await db.query(query, params);
      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error("Error finding predictions:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Delete old predictions
   */
  async deleteOlderThan(days: number): Promise<number> {
    try {
      const query = `
        DELETE FROM predictions
        WHERE predicted_timestamp < NOW() - INTERVAL '${days} days'
      `;

      const result = await db.query(query);
      const deletedCount = result.length;

      logger.info(`Deleted ${deletedCount} old predictions`);
      return deletedCount;
    } catch (error) {
      logger.error("Error deleting old predictions:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get prediction statistics for a sensor
   */
  async getStatistics(sensor_id: string): Promise<{
    total: number;
    avg_confidence: number;
    latest_prediction: Date | null;
  }> {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          AVG(confidence) as avg_confidence,
          MAX(predicted_timestamp) as latest_prediction
        FROM predictions
        WHERE sensor_id = $1
      `;

      const rows = await db.query(query, [sensor_id]);
      const stats = rows[0];

      return {
        total: parseInt(stats.total) || 0,
        avg_confidence: parseFloat(stats.avg_confidence) || 0,
        latest_prediction: stats.latest_prediction || null,
      };
    } catch (error) {
      logger.error(
        `Error getting prediction statistics for sensor ${sensor_id}:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
      throw error;
    }
  }
}

export default PredictionRepository;

// Export singleton instance
const predictionRepository = new PredictionRepository();
export { predictionRepository };
