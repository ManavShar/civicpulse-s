import { BaseRepository } from "../db/BaseRepository";
import { Sensor, SensorType } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for Sensor entity
 */
export class SensorRepository extends BaseRepository<Sensor> {
  constructor() {
    super("sensors", "id");
  }

  /**
   * Find sensors by type
   */
  async findByType(type: SensorType, client?: PoolClient): Promise<Sensor[]> {
    return this.findAll(
      [{ field: "type", operator: "=", value: type }],
      [],
      undefined,
      client
    );
  }

  /**
   * Find sensors by zone
   */
  async findByZone(zoneId: string, client?: PoolClient): Promise<Sensor[]> {
    return this.findAll(
      [{ field: "zone_id", operator: "=", value: zoneId }],
      [],
      undefined,
      client
    );
  }

  /**
   * Find sensors within a radius (in meters) of a point
   */
  async findNearby(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    client?: PoolClient
  ): Promise<Sensor[]> {
    const query = `
      SELECT *
      FROM sensors
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
   * Override mapRowToEntity to handle PostGIS geography type
   */
  protected mapRowToEntity(row: any): Sensor {
    const entity = super.mapRowToEntity(row);

    // Parse location if it's a string (PostGIS returns WKT format)
    if (typeof entity.location === "string") {
      // PostGIS returns geography as text, parse it
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

export default new SensorRepository();
