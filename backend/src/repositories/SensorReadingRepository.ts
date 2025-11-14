import { BaseRepository } from "../db/BaseRepository";
import { SensorReading } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for SensorReading entity
 */
export class SensorReadingRepository extends BaseRepository<SensorReading> {
  constructor() {
    super("sensor_readings", "id");
  }

  /**
   * Find readings for a specific sensor
   */
  async findBySensor(
    sensorId: string,
    limit: number = 100,
    client?: PoolClient
  ): Promise<SensorReading[]> {
    return this.findAll(
      [{ field: "sensor_id", operator: "=", value: sensorId }],
      [{ field: "timestamp", direction: "DESC" }],
      { limit },
      client
    );
  }

  /**
   * Find readings within a time range
   */
  async findByTimeRange(
    sensorId: string,
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<SensorReading[]> {
    return this.findAll(
      [
        { field: "sensor_id", operator: "=", value: sensorId },
        { field: "timestamp", operator: ">=", value: startTime },
        { field: "timestamp", operator: "<=", value: endTime },
      ],
      [{ field: "timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Get latest reading for a sensor
   */
  async getLatest(
    sensorId: string,
    client?: PoolClient
  ): Promise<SensorReading | null> {
    return this.findOne(
      [{ field: "sensor_id", operator: "=", value: sensorId }],
      client
    );
  }

  /**
   * Batch insert sensor readings for performance
   */
  async batchInsert(
    readings: Partial<SensorReading>[],
    client?: PoolClient
  ): Promise<void> {
    if (readings.length === 0) return;

    const values = readings
      .map(
        (_reading, i) =>
          `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${
            i * 5 + 5
          })`
      )
      .join(", ");

    const params = readings.flatMap((r) => [
      r.sensorId,
      r.timestamp,
      r.value,
      r.unit,
      JSON.stringify(r.metadata || {}),
    ]);

    const query = `
      INSERT INTO sensor_readings (sensor_id, timestamp, value, unit, metadata)
      VALUES ${values}
    `;

    await this.query(query, params, client);
  }

  /**
   * Get statistics for a sensor over a time period
   */
  async getStatistics(
    sensorId: string,
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<{
    count: number;
    avg: number;
    min: number;
    max: number;
    stddev: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as count,
        AVG(value) as avg,
        MIN(value) as min,
        MAX(value) as max,
        STDDEV(value) as stddev
      FROM sensor_readings
      WHERE sensor_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
    `;

    const rows = await this.query(
      query,
      [sensorId, startTime, endTime],
      client
    );

    return {
      count: parseInt(rows[0].count, 10),
      avg: parseFloat(rows[0].avg) || 0,
      min: parseFloat(rows[0].min) || 0,
      max: parseFloat(rows[0].max) || 0,
      stddev: parseFloat(rows[0].stddev) || 0,
    };
  }

  /**
   * Delete old readings (for data retention)
   */
  async deleteOlderThan(date: Date, client?: PoolClient): Promise<number> {
    return this.deleteWhere(
      [{ field: "timestamp", operator: "<", value: date }],
      client
    );
  }
}

export default new SensorReadingRepository();
