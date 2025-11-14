/**
 * Incident Detection Engine
 * Processes sensor readings and detects infrastructure incidents
 */

import {
  Incident,
  IncidentCategory,
  Severity,
  SensorReading,
  SensorType,
  GeoPoint,
} from "../types/entities";
import IncidentRepository from "../repositories/IncidentRepository";
import SensorRepository from "../repositories/SensorRepository";
import anomalyDetector, { AnomalyDetector } from "./AnomalyDetector";
import logger from "../utils/logger";
import { getWebSocketService } from "./WebSocketService";

interface ThresholdConfig {
  critical: number;
  warning: number;
  minimum?: number;
}

interface DetectionContext {
  sensorId: string;
  sensorType: SensorType;
  value: number;
  timestamp: Date;
  location: GeoPoint;
  zoneId: string;
}

/**
 * IncidentDetector class for processing sensor readings
 */
export class IncidentDetector {
  private anomalyDetector: AnomalyDetector;
  private recentIncidents: Map<string, Date> = new Map();
  private readonly DEDUPLICATION_WINDOW_MS = 300000; // 5 minutes
  private readonly SPATIAL_CLUSTER_RADIUS_M = 100; // 100 meters
  private readonly TEMPORAL_CLUSTER_WINDOW_MS = 300000; // 5 minutes

  // Threshold configurations by sensor type
  private readonly thresholds: Record<SensorType, ThresholdConfig> = {
    WASTE: { critical: 95, warning: 80, minimum: 0 },
    LIGHT: { critical: 10, warning: 30, minimum: 0 },
    WATER: { critical: 150, warning: 120, minimum: 20 },
    TRAFFIC: { critical: 90, warning: 70, minimum: 0 },
    ENVIRONMENT: { critical: 150, warning: 100, minimum: -20 },
    NOISE: { critical: 85, warning: 70, minimum: 0 },
  };

  constructor(anomalyDetector: AnomalyDetector) {
    this.anomalyDetector = anomalyDetector;
  }

  /**
   * Process sensor reading and detect incidents
   */
  async processReading(reading: SensorReading): Promise<Incident | null> {
    try {
      // Get sensor details
      const sensor = await SensorRepository.findById(reading.sensorId);
      if (!sensor) {
        logger.warn("Sensor not found for reading", {
          sensorId: reading.sensorId,
        });
        return null;
      }

      // Create detection context
      const context: DetectionContext = {
        sensorId: sensor.id,
        sensorType: sensor.type,
        value: reading.value,
        timestamp: reading.timestamp,
        location: sensor.location,
        zoneId: sensor.zoneId,
      };

      // Rule-based threshold checking
      const thresholdViolation = this.checkThresholds(context);

      // Statistical anomaly detection
      const anomalyResult = await this.anomalyDetector.detectAnomaly(
        reading.sensorId,
        reading.value
      );

      // Determine if incident should be created
      if (!thresholdViolation && !anomalyResult.isAnomaly) {
        return null;
      }

      // Check for spatial and temporal clustering (deduplication)
      const isDuplicate = await this.checkDuplication(context);
      if (isDuplicate) {
        logger.debug("Incident deduplicated", {
          sensorId: context.sensorId,
          value: context.value,
        });
        return null;
      }

      // Create incident
      const incident = await this.createIncident(
        context,
        thresholdViolation,
        anomalyResult.isAnomaly,
        anomalyResult.confidence
      );

      // Broadcast incident creation
      this.broadcastIncidentCreated(incident);

      // Track for deduplication
      this.trackIncident(incident);

      logger.info("Incident detected and created", {
        incidentId: incident.id,
        category: incident.category,
        severity: incident.severity,
        sensorId: context.sensorId,
      });

      return incident;
    } catch (error) {
      logger.error("Error processing reading for incident detection", {
        readingId: reading.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Check if reading violates thresholds
   */
  private checkThresholds(context: DetectionContext): boolean {
    const threshold = this.thresholds[context.sensorType];
    if (!threshold) {
      return false;
    }

    // Check critical threshold
    if (context.value >= threshold.critical) {
      return true;
    }

    // Check minimum threshold (for sensors where low values are bad)
    if (threshold.minimum !== undefined && context.value <= threshold.minimum) {
      return true;
    }

    return false;
  }

  /**
   * Check for duplicate incidents (spatial and temporal clustering)
   */
  private async checkDuplication(context: DetectionContext): Promise<boolean> {
    try {
      // Check temporal deduplication for same sensor
      const lastIncidentTime = this.recentIncidents.get(context.sensorId);
      if (lastIncidentTime) {
        const timeSinceLastIncident =
          context.timestamp.getTime() - lastIncidentTime.getTime();
        if (timeSinceLastIncident < this.DEDUPLICATION_WINDOW_MS) {
          return true;
        }
      }

      // Check spatial clustering - find nearby recent incidents
      const nearbyIncidents = await IncidentRepository.findNearby(
        context.location.coordinates[0],
        context.location.coordinates[1],
        this.SPATIAL_CLUSTER_RADIUS_M
      );

      // Filter to recent incidents (within temporal window)
      const now = context.timestamp.getTime();
      const recentNearbyIncidents = nearbyIncidents.filter((incident) => {
        const incidentTime = incident.detectedAt.getTime();
        const timeDiff = now - incidentTime;
        return (
          timeDiff >= 0 &&
          timeDiff < this.TEMPORAL_CLUSTER_WINDOW_MS &&
          incident.status === "ACTIVE"
        );
      });

      // If there are recent nearby incidents of similar type, deduplicate
      if (recentNearbyIncidents.length > 0) {
        const category = this.determineCategory(context.sensorType);
        const hasSimilarIncident = recentNearbyIncidents.some(
          (incident) => incident.category === category
        );
        if (hasSimilarIncident) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error("Error checking incident duplication", {
        sensorId: context.sensorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Create incident from detection context
   */
  private async createIncident(
    context: DetectionContext,
    thresholdViolation: boolean,
    statisticalAnomaly: boolean,
    confidence: number
  ): Promise<Incident> {
    const category = this.determineCategory(context.sensorType);
    const severity = this.determineSeverity(context);
    const description = this.generateDescription(context, category);

    const incident: Partial<Incident> = {
      type: category,
      category,
      severity,
      status: "ACTIVE",
      priorityScore: 0, // Will be calculated by ScoringService
      confidence,
      location: context.location,
      zoneId: context.zoneId,
      sensorId: context.sensorId,
      description,
      metadata: {
        thresholdViolation,
        statisticalAnomaly,
        sensorValue: context.value,
        detectionMethods: [],
      },
      detectedAt: context.timestamp,
    };

    // Add detection methods to metadata
    if (thresholdViolation) {
      incident.metadata!.detectionMethods.push("threshold");
    }
    if (statisticalAnomaly) {
      incident.metadata!.detectionMethods.push("statistical");
    }

    const createdIncident = await IncidentRepository.create(
      incident as Omit<Incident, "id" | "createdAt" | "updatedAt">
    );

    return createdIncident;
  }

  /**
   * Determine incident category from sensor type
   */
  private determineCategory(sensorType: SensorType): IncidentCategory {
    const categoryMap: Record<SensorType, IncidentCategory> = {
      WASTE: "WASTE_OVERFLOW",
      LIGHT: "LIGHTING_FAILURE",
      WATER: "WATER_ANOMALY",
      TRAFFIC: "TRAFFIC_CONGESTION",
      ENVIRONMENT: "ENVIRONMENTAL_HAZARD",
      NOISE: "NOISE_COMPLAINT",
    };

    return categoryMap[sensorType];
  }

  /**
   * Determine severity based on sensor value and thresholds
   */
  private determineSeverity(context: DetectionContext): Severity {
    const threshold = this.thresholds[context.sensorType];
    if (!threshold) {
      return "MEDIUM";
    }

    // Critical level
    if (context.value >= threshold.critical) {
      return "CRITICAL";
    }

    // Check for critically low values
    if (threshold.minimum !== undefined && context.value <= threshold.minimum) {
      return "CRITICAL";
    }

    // High level
    if (context.value >= threshold.warning * 1.2) {
      return "HIGH";
    }

    // Medium level
    if (context.value >= threshold.warning) {
      return "MEDIUM";
    }

    // Low level
    return "LOW";
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(
    context: DetectionContext,
    category: IncidentCategory
  ): string {
    const descriptions: Record<IncidentCategory, string> = {
      WASTE_OVERFLOW: `Waste container at ${context.value.toFixed(
        1
      )}% capacity - overflow risk detected`,
      LIGHTING_FAILURE: `Street lighting failure detected - illumination at ${context.value.toFixed(
        1
      )}%`,
      WATER_ANOMALY: `Water system anomaly detected - pressure at ${context.value.toFixed(
        1
      )} PSI`,
      TRAFFIC_CONGESTION: `Traffic congestion detected - ${context.value.toFixed(
        1
      )}% capacity`,
      ENVIRONMENTAL_HAZARD: `Environmental hazard detected - reading at ${context.value.toFixed(
        1
      )} units`,
      NOISE_COMPLAINT: `Excessive noise detected - ${context.value.toFixed(
        1
      )} dB`,
    };

    return descriptions[category];
  }

  /**
   * Track incident for deduplication
   */
  private trackIncident(incident: Incident): void {
    this.recentIncidents.set(incident.sensorId!, incident.detectedAt);

    // Clean up old entries periodically
    const cutoffTime = Date.now() - this.DEDUPLICATION_WINDOW_MS - 60000; // Add 1 minute buffer
    for (const [sensorId, timestamp] of this.recentIncidents.entries()) {
      if (timestamp.getTime() < cutoffTime) {
        this.recentIncidents.delete(sensorId);
      }
    }
  }

  /**
   * Broadcast incident creation via WebSocket
   */
  private broadcastIncidentCreated(incident: Incident): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("incident:created", incident);
    } catch (error) {
      logger.debug("Could not broadcast incident creation", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get threshold configuration for sensor type
   */
  getThresholds(sensorType: SensorType): ThresholdConfig | undefined {
    return this.thresholds[sensorType];
  }

  /**
   * Update threshold configuration
   */
  updateThresholds(
    sensorType: SensorType,
    thresholds: Partial<ThresholdConfig>
  ): void {
    if (this.thresholds[sensorType]) {
      Object.assign(this.thresholds[sensorType], thresholds);
      logger.info("Updated thresholds", { sensorType, thresholds });
    }
  }
}

// Create singleton instance
const incidentDetector = new IncidentDetector(anomalyDetector);

export default incidentDetector;
