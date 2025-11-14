/**
 * WebSocket event type definitions
 */

import { SensorReading, Incident, WorkOrder, AgentLog } from "./entities";

/**
 * WebSocket event types for real-time communication
 */
export type WebSocketEventType =
  | "sensor:reading"
  | "sensor:anomaly"
  | "incident:created"
  | "incident:updated"
  | "incident:resolved"
  | "workorder:created"
  | "workorder:updated"
  | "workorder:assigned"
  | "workorder:started"
  | "workorder:completed"
  | "agent:message"
  | "agent:plan_created"
  | "agent:dispatched"
  | "agent:explained"
  | "system:metrics"
  | "scenario:triggered"
  | "scenario:stopped";

/**
 * Base WebSocket event structure
 */
export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  data: T;
  timestamp: Date;
}

/**
 * Sensor-related events
 */
export interface SensorReadingEvent extends WebSocketEvent<SensorReading> {
  type: "sensor:reading";
}

export interface SensorAnomalyEvent
  extends WebSocketEvent<{
    sensorId: string;
    reading: SensorReading;
    anomalyScore: number;
  }> {
  type: "sensor:anomaly";
}

/**
 * Incident-related events
 */
export interface IncidentCreatedEvent extends WebSocketEvent<Incident> {
  type: "incident:created";
}

export interface IncidentUpdatedEvent extends WebSocketEvent<Incident> {
  type: "incident:updated";
}

export interface IncidentResolvedEvent
  extends WebSocketEvent<{ incidentId: string; resolvedAt: Date }> {
  type: "incident:resolved";
}

/**
 * Work order-related events
 */
export interface WorkOrderCreatedEvent extends WebSocketEvent<WorkOrder> {
  type: "workorder:created";
}

export interface WorkOrderUpdatedEvent extends WebSocketEvent<WorkOrder> {
  type: "workorder:updated";
}

export interface WorkOrderAssignedEvent extends WebSocketEvent<WorkOrder> {
  type: "workorder:assigned";
}

export interface WorkOrderStartedEvent extends WebSocketEvent<WorkOrder> {
  type: "workorder:started";
}

export interface WorkOrderCompletedEvent extends WebSocketEvent<WorkOrder> {
  type: "workorder:completed";
}

/**
 * Agent-related events
 */
export interface AgentMessageEvent extends WebSocketEvent<AgentLog> {
  type: "agent:message";
}

export interface AgentPlanCreatedEvent
  extends WebSocketEvent<{
    incidentId: string;
    plan: any;
  }> {
  type: "agent:plan_created";
}

export interface AgentDispatchedEvent
  extends WebSocketEvent<{
    incidentId: string;
    workOrders: string[];
  }> {
  type: "agent:dispatched";
}

export interface AgentExplainedEvent
  extends WebSocketEvent<{
    incidentId: string;
    explanation: string;
    keyFactors: string[];
    recommendations: string[];
    confidence: number;
  }> {
  type: "agent:explained";
}

/**
 * System-related events
 */
export interface SystemMetricsEvent
  extends WebSocketEvent<{
    activeIncidents: number;
    criticalIncidents: number;
    activePredictions: number;
    activeWorkOrders: number;
    overallRiskLevel: number;
    zoneStatus: {
      healthy: number;
      warning: number;
      critical: number;
    };
  }> {
  type: "system:metrics";
}

/**
 * Scenario-related events
 */
export interface ScenarioTriggeredEvent
  extends WebSocketEvent<{
    scenarioId: string;
    scenarioName: string;
    duration: number;
  }> {
  type: "scenario:triggered";
}

export interface ScenarioStoppedEvent
  extends WebSocketEvent<{
    scenarioId: string;
  }> {
  type: "scenario:stopped";
}

/**
 * Union type of all possible WebSocket events
 */
export type AnyWebSocketEvent =
  | SensorReadingEvent
  | SensorAnomalyEvent
  | IncidentCreatedEvent
  | IncidentUpdatedEvent
  | IncidentResolvedEvent
  | WorkOrderCreatedEvent
  | WorkOrderUpdatedEvent
  | WorkOrderAssignedEvent
  | WorkOrderStartedEvent
  | WorkOrderCompletedEvent
  | AgentMessageEvent
  | AgentPlanCreatedEvent
  | AgentDispatchedEvent
  | AgentExplainedEvent
  | SystemMetricsEvent
  | ScenarioTriggeredEvent
  | ScenarioStoppedEvent;

/**
 * Client-to-server events
 */
export interface ClientToServerEvents {
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  ping: () => void;
}

/**
 * Server-to-client events
 */
export interface ServerToClientEvents {
  "sensor:reading": (data: SensorReading) => void;
  "sensor:anomaly": (data: {
    sensorId: string;
    reading: SensorReading;
    anomalyScore: number;
  }) => void;
  "incident:created": (data: Incident) => void;
  "incident:updated": (data: Incident) => void;
  "incident:resolved": (data: { incidentId: string; resolvedAt: Date }) => void;
  "workorder:created": (data: WorkOrder) => void;
  "workorder:updated": (data: WorkOrder) => void;
  "workorder:assigned": (data: WorkOrder) => void;
  "workorder:started": (data: WorkOrder) => void;
  "workorder:completed": (data: WorkOrder) => void;
  "agent:message": (data: AgentLog) => void;
  "agent:plan_created": (data: { incidentId: string; plan: any }) => void;
  "agent:dispatched": (data: {
    incidentId: string;
    workOrders: string[];
  }) => void;
  "agent:explained": (data: {
    incidentId: string;
    explanation: string;
    keyFactors: string[];
    recommendations: string[];
    confidence: number;
  }) => void;
  "system:metrics": (data: {
    activeIncidents: number;
    criticalIncidents: number;
    activePredictions: number;
    activeWorkOrders: number;
    overallRiskLevel: number;
    zoneStatus: {
      healthy: number;
      warning: number;
      critical: number;
    };
  }) => void;
  "scenario:triggered": (data: {
    scenarioId: string;
    scenarioName: string;
    duration: number;
  }) => void;
  "scenario:stopped": (data: { scenarioId: string }) => void;
  pong: () => void;
  error: (error: { code: string; message: string }) => void;
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  userId?: string;
  role?: string;
  connectedAt: Date;
  subscriptions: Set<string>;
}
