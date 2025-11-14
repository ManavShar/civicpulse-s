/**
 * WebSocket utility functions for emitting events
 */

import { getWebSocketService } from "../services";
import {
  SensorReading,
  Incident,
  WorkOrder,
  AgentLog,
} from "../types/entities";
import logger from "./logger";

/**
 * Emit sensor reading event
 */
export function emitSensorReading(reading: SensorReading): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("sensor:reading", reading);
  } catch (error) {
    logger.error("Failed to emit sensor reading", {
      error: error instanceof Error ? error.message : "Unknown error",
      sensorId: reading.sensorId,
    });
  }
}

/**
 * Emit sensor anomaly event
 */
export function emitSensorAnomaly(
  sensorId: string,
  reading: SensorReading,
  anomalyScore: number
): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("sensor:anomaly", {
      sensorId,
      reading,
      anomalyScore,
    });
  } catch (error) {
    logger.error("Failed to emit sensor anomaly", {
      error: error instanceof Error ? error.message : "Unknown error",
      sensorId,
    });
  }
}

/**
 * Emit incident created event
 */
export function emitIncidentCreated(incident: Incident): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("incident:created", incident);

    // Also broadcast to zone-specific room
    wsService.broadcastToRoom(
      `zone:${incident.zoneId}`,
      "incident:created",
      incident
    );
  } catch (error) {
    logger.error("Failed to emit incident created", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId: incident.id,
    });
  }
}

/**
 * Emit incident updated event
 */
export function emitIncidentUpdated(incident: Incident): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("incident:updated", incident);

    // Also broadcast to zone-specific room
    wsService.broadcastToRoom(
      `zone:${incident.zoneId}`,
      "incident:updated",
      incident
    );
  } catch (error) {
    logger.error("Failed to emit incident updated", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId: incident.id,
    });
  }
}

/**
 * Emit incident resolved event
 */
export function emitIncidentResolved(
  incidentId: string,
  resolvedAt: Date
): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("incident:resolved", { incidentId, resolvedAt });
  } catch (error) {
    logger.error("Failed to emit incident resolved", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId,
    });
  }
}

/**
 * Emit work order created event
 */
export function emitWorkOrderCreated(workOrder: WorkOrder): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("workorder:created", workOrder);

    // Also broadcast to zone-specific room
    wsService.broadcastToRoom(
      `zone:${workOrder.zoneId}`,
      "workorder:created",
      workOrder
    );
  } catch (error) {
    logger.error("Failed to emit work order created", {
      error: error instanceof Error ? error.message : "Unknown error",
      workOrderId: workOrder.id,
    });
  }
}

/**
 * Emit work order updated event
 */
export function emitWorkOrderUpdated(workOrder: WorkOrder): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("workorder:updated", workOrder);

    // Also broadcast to zone-specific room
    wsService.broadcastToRoom(
      `zone:${workOrder.zoneId}`,
      "workorder:updated",
      workOrder
    );
  } catch (error) {
    logger.error("Failed to emit work order updated", {
      error: error instanceof Error ? error.message : "Unknown error",
      workOrderId: workOrder.id,
    });
  }
}

/**
 * Emit work order assigned event
 */
export function emitWorkOrderAssigned(workOrder: WorkOrder): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("workorder:assigned", workOrder);
  } catch (error) {
    logger.error("Failed to emit work order assigned", {
      error: error instanceof Error ? error.message : "Unknown error",
      workOrderId: workOrder.id,
    });
  }
}

/**
 * Emit work order started event
 */
export function emitWorkOrderStarted(workOrder: WorkOrder): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("workorder:started", workOrder);
  } catch (error) {
    logger.error("Failed to emit work order started", {
      error: error instanceof Error ? error.message : "Unknown error",
      workOrderId: workOrder.id,
    });
  }
}

/**
 * Emit work order completed event
 */
export function emitWorkOrderCompleted(workOrder: WorkOrder): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("workorder:completed", workOrder);
  } catch (error) {
    logger.error("Failed to emit work order completed", {
      error: error instanceof Error ? error.message : "Unknown error",
      workOrderId: workOrder.id,
    });
  }
}

/**
 * Emit agent message event
 */
export function emitAgentMessage(agentLog: AgentLog): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("agent:message", agentLog);
  } catch (error) {
    logger.error("Failed to emit agent message", {
      error: error instanceof Error ? error.message : "Unknown error",
      agentType: agentLog.agentType,
    });
  }
}

/**
 * Emit agent plan created event
 */
export function emitAgentPlanCreated(incidentId: string, plan: any): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("agent:plan_created", { incidentId, plan });
  } catch (error) {
    logger.error("Failed to emit agent plan created", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId,
    });
  }
}

/**
 * Emit agent dispatched event
 */
export function emitAgentDispatched(
  incidentId: string,
  workOrders: string[]
): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("agent:dispatched", { incidentId, workOrders });
  } catch (error) {
    logger.error("Failed to emit agent dispatched", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId,
    });
  }
}

/**
 * Emit agent explained event
 */
export function emitAgentExplained(
  incidentId: string,
  explanation: string,
  keyFactors: string[],
  recommendations: string[],
  confidence: number
): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("agent:explained", {
      incidentId,
      explanation,
      keyFactors,
      recommendations,
      confidence,
    });
  } catch (error) {
    logger.error("Failed to emit agent explained", {
      error: error instanceof Error ? error.message : "Unknown error",
      incidentId,
    });
  }
}

/**
 * Emit system metrics event
 */
export function emitSystemMetrics(metrics: {
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
}): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("system:metrics", metrics);
  } catch (error) {
    logger.error("Failed to emit system metrics", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Emit scenario triggered event
 */
export function emitScenarioTriggered(
  scenarioId: string,
  scenarioName: string,
  duration: number
): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("scenario:triggered", {
      scenarioId,
      scenarioName,
      duration,
    });
  } catch (error) {
    logger.error("Failed to emit scenario triggered", {
      error: error instanceof Error ? error.message : "Unknown error",
      scenarioId,
    });
  }
}

/**
 * Emit scenario stopped event
 */
export function emitScenarioStopped(scenarioId: string): void {
  try {
    const wsService = getWebSocketService();
    wsService.broadcast("scenario:stopped", { scenarioId });
  } catch (error) {
    logger.error("Failed to emit scenario stopped", {
      error: error instanceof Error ? error.message : "Unknown error",
      scenarioId,
    });
  }
}
