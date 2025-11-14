import { BaseRepository } from "../db/BaseRepository";
import { Zone, ZoneType } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for Zone entity
 */
export class ZoneRepository extends BaseRepository<Zone> {
  constructor() {
    super("zones", "id");
  }

  /**
   * Find zones by type
   */
  async findByType(type: ZoneType, client?: PoolClient): Promise<Zone[]> {
    return this.findAll(
      [{ field: "type", operator: "=", value: type }],
      [],
      undefined,
      client
    );
  }

  /**
   * Find zone containing a point
   */
  async findContainingPoint(
    longitude: number,
    latitude: number,
    client?: PoolClient
  ): Promise<Zone | null> {
    const query = `
      SELECT *
      FROM zones
      WHERE ST_Contains(
        boundary::geometry,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      )
      LIMIT 1
    `;

    const rows = await this.query(query, [longitude, latitude], client);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find zones intersecting with a bounding box
   */
  async findInBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
    client?: PoolClient
  ): Promise<Zone[]> {
    const query = `
      SELECT *
      FROM zones
      WHERE ST_Intersects(
        boundary::geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
    `;

    const rows = await this.query(
      query,
      [minLon, minLat, maxLon, maxLat],
      client
    );
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get zone statistics
   */
  async getStatistics(client?: PoolClient): Promise<{
    totalZones: number;
    totalPopulation: number;
    byType: Record<ZoneType, number>;
  }> {
    const countQuery = `
      SELECT COUNT(*) as total, SUM(population) as total_population
      FROM zones
    `;

    const typeQuery = `
      SELECT type, COUNT(*) as count
      FROM zones
      GROUP BY type
    `;

    const [countRows, typeRows] = await Promise.all([
      this.query<{ total: string; total_population: string }>(
        countQuery,
        [],
        client
      ),
      this.query<{ type: ZoneType; count: string }>(typeQuery, [], client),
    ]);

    const byType: Record<ZoneType, number> = {
      RESIDENTIAL: 0,
      COMMERCIAL: 0,
      INDUSTRIAL: 0,
      PARK: 0,
    };

    typeRows.forEach((row) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    return {
      totalZones: parseInt(countRows[0].total, 10),
      totalPopulation: parseInt(countRows[0].total_population, 10) || 0,
      byType,
    };
  }

  /**
   * Override mapRowToEntity to handle PostGIS geography type
   */
  protected mapRowToEntity(row: any): Zone {
    const entity = super.mapRowToEntity(row);

    // Parse boundary if it's a string
    if (typeof entity.boundary === "string") {
      // For simplicity, we'll keep it as string for now
      // In production, you'd want to parse the WKT format properly
      // This is a placeholder - actual parsing would be more complex
      (entity as any).boundary = {
        type: "Polygon",
        coordinates: [[[0, 0]]],
      };
    }

    return entity;
  }
}

export default new ZoneRepository();
