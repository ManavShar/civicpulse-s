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
   * Validate state machine transitions
   * CREATED → ASSIGNED → IN_PROGRESS → COMPLETED
   *                    ↓
   *                CANCELLED
   */
  private validateStatusTransition(
    currentStatus: WorkOrderStatus,
    newStatus: WorkOrderStatus
  ): boolean {
    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      CREATED: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Update work order status with state machine validation
   */
  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    client?: PoolClient
  ): Promise<WorkOrder | null> {
    // Get current work order to validate transition
    const currentWorkOrder = await this.findById(id, client);
    if (!currentWorkOrder) {
      throw new Error(`Work order ${id} not found`);
    }

    // Validate state transition
    if (!this.validateStatusTransition(currentWorkOrder.status, status)) {
      throw new Error(
        `Invalid status transition from ${currentWorkOrder.status} to ${status}`
      );
    }

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
   * Find work orders with multiple filters
   */
  async findWithFilters(
    filters: {
      status?: WorkOrderStatus | WorkOrderStatus[];
      zoneId?: string;
      assignedUnitId?: string;
      incidentId?: string;
      startTime?: Date;
      endTime?: Date;
    },
    client?: PoolClient
  ): Promise<WorkOrder[]> {
    const conditions: any[] = [];

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push({
          field: "status",
          operator: "IN",
          value: filters.status,
        });
      } else {
        conditions.push({
          field: "status",
          operator: "=",
          value: filters.status,
        });
      }
    }

    if (filters.zoneId) {
      conditions.push({
        field: "zone_id",
        operator: "=",
        value: filters.zoneId,
      });
    }

    if (filters.assignedUnitId) {
      conditions.push({
        field: "assigned_unit_id",
        operator: "=",
        value: filters.assignedUnitId,
      });
    }

    if (filters.incidentId) {
      conditions.push({
        field: "incident_id",
        operator: "=",
        value: filters.incidentId,
      });
    }

    if (filters.startTime) {
      conditions.push({
        field: "created_at",
        operator: ">=",
        value: filters.startTime,
      });
    }

    if (filters.endTime) {
      conditions.push({
        field: "created_at",
        operator: "<=",
        value: filters.endTime,
      });
    }

    return this.findAll(
      conditions,
      [{ field: "created_at", direction: "DESC" }],
      undefined,
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
