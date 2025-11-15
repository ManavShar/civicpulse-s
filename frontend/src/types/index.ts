// Core type definitions for CivicPulse AI

// Geographic Types
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

// Sensor Types
export type SensorType =
  | "WASTE"
  | "LIGHT"
  | "WATER"
  | "TRAFFIC"
  | "ENVIRONMENT"
  | "NOISE";
export type SensorStatus = "online" | "offline" | "warning";

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location: GeoPoint;
  zoneId: string;
  currentValue?: number;
  status: SensorStatus;
  lastReading?: SensorReading;
  metadata?: Record<string, any>;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  timestamp: Date;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

// Incident Types
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
  scoringBreakdown?: ScoringFactors;
  detectedAt: Date;
  resolvedAt?: Date;
  workOrders?: WorkOrder[];
  explanation?: Explanation;
}

// Work Order Types
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
}

// Agent Types
export type AgentType = "PLANNER" | "DISPATCHER" | "ANALYST";

export interface AgentMessage {
  id: string;
  agentType: AgentType;
  step: string;
  timestamp: Date;
  data: Record<string, any>;
  incidentId?: string;
  workOrderId?: string;
}

export interface Explanation {
  explanation: string;
  keyFactors: string[];
  recommendations: string[];
  confidence: number;
}

// Prediction Types
export interface Prediction {
  id: string;
  sensorId: string;
  predictedTimestamp: Date;
  predictedValue: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  modelVersion: string;
}

// Zone Types
export type ZoneType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "PARK";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  boundary: GeoPolygon;
  population: number;
  metadata?: Record<string, any>;
}

// System Metrics
export interface SystemMetrics {
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
}

// Timeline Types
export interface TimelineEvent {
  type: "SENSOR" | "INCIDENT" | "WORKORDER" | "AGENT";
  timestamp: Date;
  data: any;
}

export interface SystemSnapshot {
  timestamp: Date;
  sensors: Sensor[];
  incidents: Incident[];
  workOrders: WorkOrder[];
  metrics: SystemMetrics;
}

// Scenario Types
export interface Scenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  icon: string;
}

// WebSocket Event Types
export type WebSocketEvent =
  | { type: "sensor:reading"; data: SensorReading }
  | {
      type: "sensor:anomaly";
      data: { sensorId: string; reading: SensorReading };
    }
  | { type: "incident:created"; data: Incident }
  | { type: "incident:updated"; data: Incident }
  | { type: "incident:resolved"; data: { incidentId: string } }
  | { type: "workorder:created"; data: WorkOrder }
  | { type: "workorder:updated"; data: WorkOrder }
  | { type: "agent:message"; data: AgentMessage }
  | { type: "agent:plan_created"; data: any }
  | { type: "agent:dispatched"; data: any }
  | { type: "agent:explained"; data: Explanation };

// User Types
export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
