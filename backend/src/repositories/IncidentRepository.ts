import { BaseRepository } from "../db/BaseRepository";
import { Incident, IncidentStatus, Severity } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for Incident entity
 */
export class IncidentRepository extends BaseRepository<Incident> {
  constructor() {
    super("incidents", "id");
  }

  /**
   * Override findAll to include ST_AsGeoJSON for location
   */
  async findAll(
    conditions: any[] = [],
    orderBy: any[] = [],
    pagination?: any,
    client?: PoolClient
  ): Promise<Incident[]> {
    try {
      const db = await import("../db/connection");
      const pool = db.default;

      let query = `
        SELECT 
          *,
          ST_AsGeoJSON(location) as location_geojson
        FROM ${this.tableName}
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Add conditions
      conditions.forEach((condition) => {
        query += ` AND ${condition.field} ${condition.operator} $${paramIndex}`;
        params.push(condition.value);
        paramIndex++;
      });

      // Add ordering
      if (orderBy.length > 0) {
        query +=
          " ORDER BY " +
          orderBy.map((o) => `${o.field} ${o.direction}`).join(", ");
      }

      // Add pagination
      if (pagination) {
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(pagination.limit, pagination.offset);
      }

      let rows: any[];
      if (client) {
        const result = await client.query(query, params);
        rows = result.rows;
      } else {
        rows = await pool.query(query, params);
      }

      return rows.map((row: any) => this.mapRowToEntity(row));
    } catch (error) {
      const logger = await import("../utils/logger");
      logger.default.error(`Error finding all ${this.tableName}`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find active incidents
   */
  async findActive(client?: PoolClient): Promise<Incident[]> {
    return this.findAll(
      [{ field: "status", operator: "=", value: "ACTIVE" }],
      [{ field: "priority_score", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find incidents by status
   */
  async findByStatus(
    status: IncidentStatus,
    client?: PoolClient
  ): Promise<Incident[]> {
    return this.findAll(
      [{ field: "status", operator: "=", value: status }],
      [{ field: "detected_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find incidents by severity
   */
  async findBySeverity(
    severity: Severity,
    client?: PoolClient
  ): Promise<Incident[]> {
    return this.findAll(
      [{ field: "severity", operator: "=", value: severity }],
      [{ field: "priority_score", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find incidents by zone
   */
  async findByZone(zoneId: string, client?: PoolClient): Promise<Incident[]> {
    return this.findAll(
      [{ field: "zone_id", operator: "=", value: zoneId }],
      [{ field: "detected_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find incidents within a time range
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<Incident[]> {
    return this.findAll(
      [
        { field: "detected_at", operator: ">=", value: startTime },
        { field: "detected_at", operator: "<=", value: endTime },
      ],
      [{ field: "detected_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find incidents near a location
   */
  async findNearby(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    client?: PoolClient
  ): Promise<Incident[]> {
    const query = `
      SELECT *
      FROM incidents
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
    `;

    const rows = await this.query(
      query,
      [longitude, latitude, radiusMeters],
      client
    );
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get incident counts by severity
   */
  async getCountsBySeverity(
    client?: PoolClient
  ): Promise<Record<Severity, number>> {
    const query = `
      SELECT severity, COUNT(*) as count
      FROM incidents
      WHERE status = 'ACTIVE'
      GROUP BY severity
    `;

    const rows = await this.query<{ severity: Severity; count: string }>(
      query,
      [],
      client
    );

    const counts: Record<Severity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    rows.forEach((row) => {
      counts[row.severity] = parseInt(row.count, 10);
    });

    return counts;
  }

  /**
   * Resolve an incident
   */
  async resolve(id: string, client?: PoolClient): Promise<Incident | null> {
    return this.update(
      id,
      {
        status: "RESOLVED",
        resolvedAt: new Date(),
      } as Partial<Incident>,
      client
    );
  }

  /**
   * Dismiss an incident
   */
  async dismiss(id: string, client?: PoolClient): Promise<Incident | null> {
    return this.update(
      id,
      {
        status: "DISMISSED",
      } as Partial<Incident>,
      client
    );
  }

  /**
   * Override mapRowToEntity to handle PostGIS geography type
   */
  protected mapRowToEntity(row: any): Incident {
    const entity = super.mapRowToEntity(row);

    // Parse location GeoJSON if it exists
    if (row.location_geojson) {
      try {
        const geoJson = JSON.parse(row.location_geojson);
        entity.location = {
          type: geoJson.type,
          coordinates: geoJson.coordinates,
        };
      } catch (error) {
        // If parsing fails, set to null
        entity.location = null as any;
      }
    } else if (typeof entity.location === "string") {
      // Fallback: parse WKT format
      const locationStr = entity.location as string;
      const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        entity.location = {
          type: "Point",
          coordinates: [parseFloat(match[1]), parseFloat(match[2])],
        };
      }
    }

    return entity;
  }
}

export default new IncidentRepository();
