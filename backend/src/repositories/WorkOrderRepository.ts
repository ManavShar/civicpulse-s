import { BaseRepository } from "../db/BaseRepository";
import { WorkOrder, WorkOrderStatus } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for WorkOrder entity
 */
export class WorkOrderRepository extends BaseRepository<WorkOrder> {
  constructor() {
    super("work_orders", "id");
  }

  /**
   * Find work orders by status
   */
  async findByStatus(
    status: WorkOrderStatus,
    client?: PoolClient
  ): Promise<WorkOrder[]> {
    return this.findAll(
      [{ field: "status", operator: "=", value: status }],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find active work orders (not completed or cancelled)
   */
  async findActive(client?: PoolClient): Promise<WorkOrder[]> {
    return this.findAll(
      [
        {
          field: "status",
          operator: "IN",
          value: ["CREATED", "ASSIGNED", "IN_PROGRESS"],
        },
      ],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find work orders by incident
   */
  async findByIncident(
    incidentId: string,
    client?: PoolClient
  ): Promise<WorkOrder[]> {
    return this.findAll(
      [{ field: "incident_id", operator: "=", value: incidentId }],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find work orders by zone
   */
  async findByZone(zoneId: string, client?: PoolClient): Promise<WorkOrder[]> {
    return this.findAll(
      [{ field: "zone_id", operator: "=", value: zoneId }],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find work orders assigned to a unit
   */
  async findByUnit(unitId: string, client?: PoolClient): Promise<WorkOrder[]> {
    return this.findAll(
      [{ field: "assigned_unit_id", operator: "=", value: unitId }],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find work orders within a time range
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<WorkOrder[]> {
    return this.findAll(
      [
        { field: "created_at", operator: ">=", value: startTime },
        { field: "created_at", operator: "<=", value: endTime },
      ],
      [{ field: "created_at", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Update work order status
   */
  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    client?: PoolClient
  ): Promise<WorkOrder | null> {
    const updateData: Partial<WorkOrder> = { status };

    // Set timestamps based on status
    if (status === "IN_PROGRESS") {
      updateData.startedAt = new Date();
    } else if (status === "COMPLETED" || status === "CANCELLED") {
      updateData.completedAt = new Date();
    }

    return this.update(id, updateData, client);
  }

  /**
   * Assign work order to a unit
   */
  async assignToUnit(
    id: string,
    unitId: string,
    client?: PoolClient
  ): Promise<WorkOrder | null> {
    return this.update(
      id,
      {
        assignedUnitId: unitId,
        status: "ASSIGNED",
      } as Partial<WorkOrder>,
      client
    );
  }

  /**
   * Get work order counts by status
   */
  async getCountsByStatus(
    client?: PoolClient
  ): Promise<Record<WorkOrderStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM work_orders
      GROUP BY status
    `;

    const rows = await this.query<{ status: WorkOrderStatus; count: string }>(
      query,
      [],
      client
    );

    const counts: Record<WorkOrderStatus, number> = {
      CREATED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    rows.forEach((row) => {
      counts[row.status] = parseInt(row.count, 10);
    });

    return counts;
  }

  /**
   * Override mapRowToEntity to handle PostGIS geography type
   */
  protected mapRowToEntity(row: any): WorkOrder {
    const entity = super.mapRowToEntity(row);

    // Parse location if it's a string
    if (typeof entity.location === "string") {
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

export default new WorkOrderRepository();
