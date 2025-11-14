import { BaseRepository } from "../db/BaseRepository";
import { Prediction } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for Prediction entity
 */
export class PredictionRepository extends BaseRepository<Prediction> {
  constructor() {
    super("predictions", "id");
  }

  /**
   * Find predictions for a specific sensor
   */
  async findBySensor(
    sensorId: string,
    client?: PoolClient
  ): Promise<Prediction[]> {
    return this.findAll(
      [{ field: "sensor_id", operator: "=", value: sensorId }],
      [{ field: "predicted_timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Find predictions within a time range
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<Prediction[]> {
    return this.findAll(
      [
        { field: "predicted_timestamp", operator: ">=", value: startTime },
        { field: "predicted_timestamp", operator: "<=", value: endTime },
      ],
      [{ field: "predicted_timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Find predictions with confidence above threshold
   */
  async findHighConfidence(
    minConfidence: number,
    client?: PoolClient
  ): Promise<Prediction[]> {
    return this.findAll(
      [{ field: "confidence", operator: ">=", value: minConfidence }],
      [{ field: "confidence", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Get latest predictions for all sensors
   */
  async getLatestForAllSensors(client?: PoolClient): Promise<Prediction[]> {
    const query = `
      SELECT DISTINCT ON (sensor_id) *
      FROM predictions
      ORDER BY sensor_id, predicted_timestamp DESC
    `;

    const rows = await this.query(query, [], client);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Delete old predictions
   */
  async deleteOlderThan(date: Date, client?: PoolClient): Promise<number> {
    return this.deleteWhere(
      [{ field: "predicted_timestamp", operator: "<", value: date }],
      client
    );
  }

  /**
   * Delete predictions for a sensor
   */
  async deleteBySensor(sensorId: string, client?: PoolClient): Promise<number> {
    return this.deleteWhere(
      [{ field: "sensor_id", operator: "=", value: sensorId }],
      client
    );
  }
}

export default new PredictionRepository();
