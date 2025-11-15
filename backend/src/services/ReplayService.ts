import { Pool } from "pg";
import {
  SensorReading,
  Incident,
  WorkOrder,
  AgentLog,
} from "../types/entities";
import logger from "../utils/logger";
import { CacheService } from "./CacheService";

export type TimelineEventType = "SENSOR" | "INCIDENT" | "WORKORDER" | "AGENT";

export interface TimelineEvent {
  type: TimelineEventType;
  timestamp: Date;
  data: SensorReading | Incident | WorkOrder | AgentLog;
}

export interface SystemSnapshot {
  timestamp: Date;
  sensors: Array<{
    id: string;
    name: string;
    type: string;
    location: any;
    zoneId: string;
    currentValue?: number;
    status: string;
  }>;
  incidents: Incident[];
  workOrders: WorkOrder[];
  metrics: {
    activeIncidents: number;
    criticalIncidents: number;
    activePredictions: number;
    activeWorkOrders: number;
    overallRiskLevel: number;
  };
}

export interface TimelineQuery {
  startTime: Date;
  endTime: Date;
  eventTypes?: TimelineEventType[];
  limit?: number;
  offset?: number;
}

export class ReplayService {
  private db: Pool;
  private cache: CacheService;

  constructor(db: Pool, cache: CacheService) {
    this.db = db;
    this.cache = cache;
  }

  /**
   * Fetch and merge events from different sources for timeline reconstruction
   */
  async getTimeline(query: TimelineQuery): Promise<TimelineEvent[]> {
    const { startTime, endTime, eventTypes, limit = 1000, offset = 0 } = query;

    logger.info("Fetching timeline events", {
      startTime,
      endTime,
      eventTypes,
      limit,
      offset,
    });

    // Check cache first
    const cacheKey = `timeline:${startTime.getTime()}:${endTime.getTime()}:${
      eventTypes?.join(",") || "all"
    }:${limit}:${offset}`;
    const cached = await this.cache.get<TimelineEvent[]>(cacheKey);
    if (cached) {
      logger.debug("Returning cached timeline events");
      return cached;
    }

    // Determine which event types to fetch
    const typesToFetch = eventTypes || [
      "SENSOR",
      "INCIDENT",
      "WORKORDER",
      "AGENT",
    ];

    // Fetch events in parallel
    const [sensorReadings, incidents, workOrders, agentLogs] =
      await Promise.all([
        typesToFetch.includes("SENSOR")
          ? this.fetchSensorReadings(startTime, endTime)
          : Promise.resolve([]),
        typesToFetch.includes("INCIDENT")
          ? this.fetchIncidents(startTime, endTime)
          : Promise.resolve([]),
        typesToFetch.includes("WORKORDER")
          ? this.fetchWorkOrders(startTime, endTime)
          : Promise.resolve([]),
        typesToFetch.includes("AGENT")
          ? this.fetchAgentLogs(startTime, endTime)
          : Promise.resolve([]),
      ]);

    // Merge and sort events by timestamp
    const events: TimelineEvent[] = [
      ...sensorReadings.map((reading) => ({
        type: "SENSOR" as TimelineEventType,
        timestamp: reading.timestamp,
        data: reading,
      })),
      ...incidents.map((incident) => ({
        type: "INCIDENT" as TimelineEventType,
        timestamp: incident.detectedAt,
        data: incident,
      })),
      ...workOrders.map((workOrder) => ({
        type: "WORKORDER" as TimelineEventType,
        timestamp: workOrder.createdAt,
        data: workOrder,
      })),
      ...agentLogs.map((log) => ({
        type: "AGENT" as TimelineEventType,
        timestamp: log.timestamp,
        data: log,
      })),
    ];

    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit);

    // Cache the results for 5 minutes
    await this.cache.set(cacheKey, paginatedEvents, 300);

    logger.info("Timeline events fetched", {
      totalEvents: events.length,
      returnedEvents: paginatedEvents.length,
    });

    return paginatedEvents;
  }

  /**
   * Get system state at a specific timestamp
   */
  async getSnapshot(timestamp: Date): Promise<SystemSnapshot> {
    logger.info("Fetching system snapshot", { timestamp });

    // Check cache first
    const cacheKey = `snapshot:${timestamp.getTime()}`;
    const cached = await this.cache.get<SystemSnapshot>(cacheKey);
    if (cached) {
      logger.debug("Returning cached snapshot");
      return cached;
    }

    // Fetch state at specific point in time
    const [sensors, incidents, workOrders, metrics] = await Promise.all([
      this.getSensorsStateAt(timestamp),
      this.getActiveIncidentsAt(timestamp),
      this.getActiveWorkOrdersAt(timestamp),
      this.calculateMetricsAt(timestamp),
    ]);

    const snapshot: SystemSnapshot = {
      timestamp,
      sensors,
      incidents,
      workOrders,
      metrics,
    };

    // Cache the snapshot for 10 minutes
    await this.cache.set(cacheKey, snapshot, 600);

    logger.info("System snapshot created", {
      sensorsCount: sensors.length,
      incidentsCount: incidents.length,
      workOrdersCount: workOrders.length,
    });

    return snapshot;
  }

  /**
   * Fetch sensor readings within time range
   */
  private async fetchSensorReadings(
    startTime: Date,
    endTime: Date
  ): Promise<SensorReading[]> {
    const query = `
      SELECT 
        id::text,
        sensor_id::text as "sensorId",
        timestamp,
        value,
        unit,
        metadata,
        created_at as "createdAt"
      FROM sensor_readings
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp ASC
      LIMIT 10000
    `;

    const result = await this.db.query(query, [startTime, endTime]);
    return result.rows;
  }

  /**
   * Fetch incidents within time range
   */
  private async fetchIncidents(
    startTime: Date,
    endTime: Date
  ): Promise<Incident[]> {
    const query = `
      SELECT 
        id::text,
        type,
        category,
        severity,
        status,
        priority_score as "priorityScore",
        confidence,
        ST_AsGeoJSON(location)::json as location,
        zone_id::text as "zoneId",
        sensor_id::text as "sensorId",
        description,
        metadata,
        scoring_breakdown as "scoringBreakdown",
        detected_at as "detectedAt",
        resolved_at as "resolvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM incidents
      WHERE detected_at >= $1 AND detected_at <= $2
      ORDER BY detected_at ASC
    `;

    const result = await this.db.query(query, [startTime, endTime]);
    return result.rows;
  }

  /**
   * Fetch work orders within time range
   */
  private async fetchWorkOrders(
    startTime: Date,
    endTime: Date
  ): Promise<WorkOrder[]> {
    const query = `
      SELECT 
        id::text,
        incident_id::text as "incidentId",
        title,
        description,
        status,
        priority,
        assigned_unit_id as "assignedUnitId",
        ST_AsGeoJSON(location)::json as location,
        zone_id::text as "zoneId",
        estimated_duration as "estimatedDuration",
        estimated_completion as "estimatedCompletion",
        started_at as "startedAt",
        completed_at as "completedAt",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM work_orders
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at ASC
    `;

    const result = await this.db.query(query, [startTime, endTime]);
    return result.rows;
  }

  /**
   * Fetch agent logs within time range
   */
  private async fetchAgentLogs(
    startTime: Date,
    endTime: Date
  ): Promise<AgentLog[]> {
    const query = `
      SELECT 
        id::text,
        agent_type as "agentType",
        step,
        incident_id::text as "incidentId",
        work_order_id::text as "workOrderId",
        data,
        timestamp
      FROM agent_logs
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp ASC
      LIMIT 5000
    `;

    const result = await this.db.query(query, [startTime, endTime]);
    return result.rows;
  }

  /**
   * Get sensors state at specific timestamp
   */
  private async getSensorsStateAt(
    timestamp: Date
  ): Promise<SystemSnapshot["sensors"]> {
    const query = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (sensor_id)
          sensor_id,
          value,
          timestamp
        FROM sensor_readings
        WHERE timestamp <= $1
        ORDER BY sensor_id, timestamp DESC
      )
      SELECT 
        s.id::text,
        s.name,
        s.type,
        ST_AsGeoJSON(s.location)::json as location,
        s.zone_id::text as "zoneId",
        lr.value as "currentValue",
        CASE 
          WHEN lr.timestamp IS NULL THEN 'offline'
          WHEN lr.timestamp < $1 - INTERVAL '5 minutes' THEN 'offline'
          ELSE 'online'
        END as status
      FROM sensors s
      LEFT JOIN latest_readings lr ON s.id = lr.sensor_id
      WHERE s.created_at <= $1
    `;

    const result = await this.db.query(query, [timestamp]);
    return result.rows;
  }

  /**
   * Get active incidents at specific timestamp
   */
  private async getActiveIncidentsAt(timestamp: Date): Promise<Incident[]> {
    const query = `
      SELECT 
        id::text,
        type,
        category,
        severity,
        status,
        priority_score as "priorityScore",
        confidence,
        ST_AsGeoJSON(location)::json as location,
        zone_id::text as "zoneId",
        sensor_id::text as "sensorId",
        description,
        metadata,
        scoring_breakdown as "scoringBreakdown",
        detected_at as "detectedAt",
        resolved_at as "resolvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM incidents
      WHERE detected_at <= $1
        AND (resolved_at IS NULL OR resolved_at > $1)
        AND status = 'ACTIVE'
      ORDER BY priority_score DESC
    `;

    const result = await this.db.query(query, [timestamp]);
    return result.rows;
  }

  /**
   * Get active work orders at specific timestamp
   */
  private async getActiveWorkOrdersAt(timestamp: Date): Promise<WorkOrder[]> {
    const query = `
      SELECT 
        id::text,
        incident_id::text as "incidentId",
        title,
        description,
        status,
        priority,
        assigned_unit_id as "assignedUnitId",
        ST_AsGeoJSON(location)::json as location,
        zone_id::text as "zoneId",
        estimated_duration as "estimatedDuration",
        estimated_completion as "estimatedCompletion",
        started_at as "startedAt",
        completed_at as "completedAt",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM work_orders
      WHERE created_at <= $1
        AND (completed_at IS NULL OR completed_at > $1)
        AND status IN ('CREATED', 'ASSIGNED', 'IN_PROGRESS')
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [timestamp]);
    return result.rows;
  }

  /**
   * Calculate system metrics at specific timestamp
   */
  private async calculateMetricsAt(
    timestamp: Date
  ): Promise<SystemSnapshot["metrics"]> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_incidents,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND severity = 'CRITICAL') as critical_incidents,
        (
          SELECT COUNT(*) 
          FROM predictions 
          WHERE created_at <= $1 
            AND predicted_timestamp > $1
        ) as active_predictions,
        (
          SELECT COUNT(*) 
          FROM work_orders 
          WHERE created_at <= $1 
            AND (completed_at IS NULL OR completed_at > $1)
            AND status IN ('CREATED', 'ASSIGNED', 'IN_PROGRESS')
        ) as active_work_orders,
        COALESCE(AVG(priority_score) FILTER (WHERE status = 'ACTIVE'), 0) as avg_priority
      FROM incidents
      WHERE detected_at <= $1
        AND (resolved_at IS NULL OR resolved_at > $1)
    `;

    const result = await this.db.query(query, [timestamp]);
    const row = result.rows[0];

    return {
      activeIncidents: parseInt(row.active_incidents) || 0,
      criticalIncidents: parseInt(row.critical_incidents) || 0,
      activePredictions: parseInt(row.active_predictions) || 0,
      activeWorkOrders: parseInt(row.active_work_orders) || 0,
      overallRiskLevel: Math.min(
        100,
        Math.round(parseFloat(row.avg_priority) || 0)
      ),
    };
  }
}
