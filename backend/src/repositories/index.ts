/**
 * Repository exports
 * Provides centralized access to all repository instances
 */

export { SensorRepository } from "./SensorRepository";
export { SensorReadingRepository } from "./SensorReadingRepository";
export { IncidentRepository } from "./IncidentRepository";
export { PredictionRepository } from "./PredictionRepository";
export { WorkOrderRepository } from "./WorkOrderRepository";
export { ZoneRepository } from "./ZoneRepository";
export { AgentLogRepository } from "./AgentLogRepository";

// Export singleton instances
import sensorRepository from "./SensorRepository";
import sensorReadingRepository from "./SensorReadingRepository";
import incidentRepository from "./IncidentRepository";
import predictionRepository from "./PredictionRepository";
import workOrderRepository from "./WorkOrderRepository";
import zoneRepository from "./ZoneRepository";
import agentLogRepository from "./AgentLogRepository";

export const repositories = {
  sensor: sensorRepository,
  sensorReading: sensorReadingRepository,
  incident: incidentRepository,
  prediction: predictionRepository,
  workOrder: workOrderRepository,
  zone: zoneRepository,
  agentLog: agentLogRepository,
};

export default repositories;
