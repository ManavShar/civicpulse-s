import { BaseRepository } from "../db/BaseRepository";
import { AgentLog, AgentType } from "../types/entities";
import { PoolClient } from "pg";

/**
 * Repository for AgentLog entity
 */
export class AgentLogRepository extends BaseRepository<AgentLog> {
  constructor() {
    super("agent_logs", "id");
  }

  /**
   * Find logs by agent type
   */
  async findByAgentType(
    agentType: AgentType,
    client?: PoolClient
  ): Promise<AgentLog[]> {
    return this.findAll(
      [{ field: "agent_type", operator: "=", value: agentType }],
      [{ field: "timestamp", direction: "DESC" }],
      undefined,
      client
    );
  }

  /**
   * Find logs by incident
   */
  async findByIncident(
    incidentId: string,
    client?: PoolClient
  ): Promise<AgentLog[]> {
    return this.findAll(
      [{ field: "incident_id", operator: "=", value: incidentId }],
      [{ field: "timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Find logs by work order
   */
  async findByWorkOrder(
    workOrderId: string,
    client?: PoolClient
  ): Promise<AgentLog[]> {
    return this.findAll(
      [{ field: "work_order_id", operator: "=", value: workOrderId }],
      [{ field: "timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Find logs within a time range
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    client?: PoolClient
  ): Promise<AgentLog[]> {
    return this.findAll(
      [
        { field: "timestamp", operator: ">=", value: startTime },
        { field: "timestamp", operator: "<=", value: endTime },
      ],
      [{ field: "timestamp", direction: "ASC" }],
      undefined,
      client
    );
  }

  /**
   * Get recent logs with limit
   */
  async getRecent(
    limit: number = 100,
    client?: PoolClient
  ): Promise<AgentLog[]> {
    return this.findAll(
      [],
      [{ field: "timestamp", direction: "DESC" }],
      { limit },
      client
    );
  }

  /**
   * Delete old logs (for data retention)
   */
  async deleteOlderThan(date: Date, client?: PoolClient): Promise<number> {
    return this.deleteWhere(
      [{ field: "timestamp", operator: "<", value: date }],
      client
    );
  }

  /**
   * Get log counts by agent type
   */
  async getCountsByAgentType(
    client?: PoolClient
  ): Promise<Record<AgentType, number>> {
    const query = `
      SELECT agent_type, COUNT(*) as count
      FROM agent_logs
      GROUP BY agent_type
    `;

    const rows = await this.query<{ agent_type: AgentType; count: string }>(
      query,
      [],
      client
    );

    const counts: Record<AgentType, number> = {
      PLANNER: 0,
      DISPATCHER: 0,
      ANALYST: 0,
    };

    rows.forEach((row) => {
      counts[row.agent_type] = parseInt(row.count, 10);
    });

    return counts;
  }
}

export default new AgentLogRepository();
