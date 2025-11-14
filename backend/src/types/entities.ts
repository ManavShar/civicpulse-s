/**
 * Entity type definitions matching database schema
 */

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export type SensorType =
  | "WASTE"
  | "LIGHT"
  | "WATER"
  | "TRAFFIC"
  | "ENVIRONMENT"
  | "NOISE";

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location: GeoPoint;
  zoneId: string;
  metadata?: Record<string, any>;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  timestamp: Date;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type IncidentCategory =
  | "WASTE_OVERFLOW"
  | "LIGHTING_FAILURE"
  | "WATER_ANOMALY"
  | "TRAFFIC_CONGESTION"
  | "ENVIRONMENTAL_HAZARD"
  | "NOISE_COMPLAINT";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "ACTIVE" | "RESOLVED" | "DISMISSED";

export interface ScoringFactors {
  severity: number;
  urgency: number;
  publicImpact: number;
  environmentalCost: number;
  safetyRisk: number;
}

export interface Incident {
  id: string;
  type: string;
  category: IncidentCategory;
  severity: Severity;
  status: IncidentStatus;
  priorityScore: number;
  confidence: number;
  location: GeoPoint;
  zoneId: string;
  sensorId?: string;
  description: string;
  metadata?: Record<string, any>;
  scoringBreakdown?: ScoringFactors;
  detectedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prediction {
  id: string;
  sensorId: string;
  predictedTimestamp: Date;
  predictedValue: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  modelVersion: string;
  createdAt: Date;
}

export type WorkOrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface WorkOrder {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: Priority;
  assignedUnitId?: string;
  location: GeoPoint;
  zoneId: string;
  estimatedDuration: number; // minutes
  estimatedCompletion?: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentType = "PLANNER" | "DISPATCHER" | "ANALYST";

export interface AgentLog {
  id: string;
  agentType: AgentType;
  step: string;
  incidentId?: string;
  workOrderId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export type ZoneType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "PARK";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  boundary: GeoPolygon;
  population: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}
