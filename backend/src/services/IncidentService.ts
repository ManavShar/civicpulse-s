/**
 * Incident Service
 * Manages incident lifecycle and operations
 */

import {
  Incident,
  IncidentStatus,
  Severity,
  SensorReading,
} from "../types/entities";
import IncidentRepository from "../repositories/IncidentRepository";
import incidentDetector, { IncidentDetector } from "./IncidentDetector";
import scoringService, { ScoringService } from "./ScoringService";
import { getWebSocketService } from "./WebSocketService";
import logger from "../utils/logger";

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: Severity;
  zoneId?: string;
  category?: string;
  minPriority?: number;
  maxPriority?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface IncidentSortOptions {
  field: "priority_score" | "detected_at" | "severity";
  direction: "ASC" | "DESC";
}

/**
 * IncidentService manages incident operations
 */
export class IncidentService {
  private detector: IncidentDetector;
  private scoringService: ScoringService;

  constructor(detector: IncidentDetector, scoringService: ScoringService) {
    this.detector = detector;
    this.scoringService = scoringService;
  }

  /**
   * Process sensor reading and detect incidents
   */
  async processReading(reading: SensorReading): Promise<Incident | null> {
    try {
      // Detect incident
      const incident = await this.detector.processReading(reading);

      if (incident) {
        // Calculate priority score
        const scoredIncident = await this.scoringService.scoreIncident(
          incident
        );

        // Update in database
        await IncidentRepository.update(scoredIncident.id, {
          priorityScore: scoredIncident.priorityScore,
          scoringBreakdown: scoredIncident.scoringBreakdown,
        });

        // Broadcast updated incident
        this.broadcastIncidentUpdated(scoredIncident);

        return scoredIncident;
      }

      return null;
    } catch (error) {
      logger.error("Error processing reading for incident", {
        readingId: reading.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Get all incidents with optional filtering and sorting
   */
  async getIncidents(
    filters?: IncidentFilters,
    sort?: IncidentSortOptions,
    limit?: number,
    offset?: number
  ): Promise<{ incidents: Incident[]; total: number }> {
    try {
      // Build query conditions
      const conditions: any[] = [];

      if (filters?.status) {
        conditions.push({
          field: "status",
          operator: "=",
          value: filters.status,
        });
      }

      if (filters?.severity) {
        conditions.push({
          field: "severity",
          operator: "=",
          value: filters.severity,
        });
      }

      if (filters?.zoneId) {
        conditions.push({
          field: "zone_id",
          operator: "=",
          value: filters.zoneId,
        });
      }

      if (filters?.category) {
        conditions.push({
          field: "category",
          operator: "=",
          value: filters.category,
        });
      }

      if (filters?.minPriority !== undefined) {
        conditions.push({
          field: "priority_score",
          operator: ">=",
          value: filters.minPriority,
        });
      }

      if (filters?.maxPriority !== undefined) {
        conditions.push({
          field: "priority_score",
          operator: "<=",
          value: filters.maxPriority,
        });
      }

      if (filters?.startTime) {
        conditions.push({
          field: "detected_at",
          operator: ">=",
          value: filters.startTime,
        });
      }

      if (filters?.endTime) {
        conditions.push({
          field: "detected_at",
          operator: "<=",
          value: filters.endTime,
        });
      }

      // Build sort options
      const sortOptions = sort
        ? [{ field: sort.field, direction: sort.direction }]
        : [{ field: "priority_score", direction: "DESC" as const }];

      // Fetch incidents
      const incidents = await IncidentRepository.findAll(
        conditions,
        sortOptions,
        undefined
      );

      // Apply limit and offset if provided
      let paginatedIncidents = incidents;
      if (offset !== undefined || limit !== undefined) {
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        paginatedIncidents = incidents.slice(start, end);
      }

      return {
        incidents: paginatedIncidents,
        total: incidents.length,
      };
    } catch (error) {
      logger.error("Error fetching incidents", {
        filters,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get incident by ID
   */
  async getIncident(id: string): Promise<Incident | null> {
    try {
      return await IncidentRepository.findById(id);
    } catch (error) {
      logger.error("Error fetching incident", {
        incidentId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Create manual incident
   */
  async createIncident(
    incidentData: Omit<Incident, "id" | "createdAt" | "updatedAt">
  ): Promise<Incident> {
    try {
      // Create incident
      const incident = await IncidentRepository.create(incidentData);

      // Calculate priority score
      const scoredIncident = await this.scoringService.scoreIncident(incident);

      // Update with score
      const updatedIncident = await IncidentRepository.update(
        scoredIncident.id,
        {
          priorityScore: scoredIncident.priorityScore,
          scoringBreakdown: scoredIncident.scoringBreakdown,
        }
      );

      if (updatedIncident) {
        // Broadcast creation
        this.broadcastIncidentCreated(updatedIncident);

        logger.info("Manual incident created", {
          incidentId: updatedIncident.id,
          category: updatedIncident.category,
        });

        return updatedIncident;
      }

      return scoredIncident;
    } catch (error) {
      logger.error("Error creating incident", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Update incident
   */
  async updateIncident(
    id: string,
    updates: Partial<Incident>
  ): Promise<Incident | null> {
    try {
      const updatedIncident = await IncidentRepository.update(id, updates);

      if (updatedIncident) {
        // Recalculate priority if relevant fields changed
        if (
          updates.severity ||
          updates.category ||
          updates.metadata ||
          updates.zoneId
        ) {
          const scoredIncident = await this.scoringService.scoreIncident(
            updatedIncident
          );
          await IncidentRepository.update(scoredIncident.id, {
            priorityScore: scoredIncident.priorityScore,
            scoringBreakdown: scoredIncident.scoringBreakdown,
          });
        }

        // Broadcast update
        this.broadcastIncidentUpdated(updatedIncident);

        logger.info("Incident updated", {
          incidentId: id,
          updates: Object.keys(updates),
        });
      }

      return updatedIncident;
    } catch (error) {
      logger.error("Error updating incident", {
        incidentId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Resolve incident
   */
  async resolveIncident(id: string): Promise<Incident | null> {
    try {
      const incident = await IncidentRepository.resolve(id);

      if (incident) {
        // Broadcast resolution
        this.broadcastIncidentResolved(incident);

        logger.info("Incident resolved", { incidentId: id });
      }

      return incident;
    } catch (error) {
      logger.error("Error resolving incident", {
        incidentId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Dismiss incident
   */
  async dismissIncident(id: string): Promise<Incident | null> {
    try {
      const incident = await IncidentRepository.dismiss(id);

      if (incident) {
        // Broadcast update
        this.broadcastIncidentUpdated(incident);

        logger.info("Incident dismissed", { incidentId: id });
      }

      return incident;
    } catch (error) {
      logger.error("Error dismissing incident", {
        incidentId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<boolean> {
    try {
      const deleted = await IncidentRepository.delete(id);

      if (deleted) {
        logger.info("Incident deleted", { incidentId: id });
      }

      return deleted;
    } catch (error) {
      logger.error("Error deleting incident", {
        incidentId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<Incident[]> {
    try {
      return await IncidentRepository.findActive();
    } catch (error) {
      logger.error("Error fetching active incidents", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get incident counts by severity
   */
  async getIncidentCountsBySeverity(): Promise<Record<Severity, number>> {
    try {
      return await IncidentRepository.getCountsBySeverity();
    } catch (error) {
      logger.error("Error fetching incident counts", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get incidents by zone
   */
  async getIncidentsByZone(zoneId: string): Promise<Incident[]> {
    try {
      return await IncidentRepository.findByZone(zoneId);
    } catch (error) {
      logger.error("Error fetching incidents by zone", {
        zoneId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get incidents in time range
   */
  async getIncidentsByTimeRange(
    startTime: Date,
    endTime: Date
  ): Promise<Incident[]> {
    try {
      return await IncidentRepository.findByTimeRange(startTime, endTime);
    } catch (error) {
      logger.error("Error fetching incidents by time range", {
        startTime,
        endTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Broadcast incident created event
   */
  private broadcastIncidentCreated(incident: Incident): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("incident:created", incident);
    } catch (error) {
      logger.debug("Could not broadcast incident created", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Broadcast incident updated event
   */
  private broadcastIncidentUpdated(incident: Incident): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("incident:updated", incident);
    } catch (error) {
      logger.debug("Could not broadcast incident updated", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Broadcast incident resolved event
   */
  private broadcastIncidentResolved(incident: Incident): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("incident:resolved", { incidentId: incident.id });
    } catch (error) {
      logger.debug("Could not broadcast incident resolved", {
        incidentId: incident.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Create singleton instance
const incidentService = new IncidentService(incidentDetector, scoringService);

export default incidentService;
