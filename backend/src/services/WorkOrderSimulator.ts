/**
 * Work Order Simulator Service
 * Simulates work order lifecycle with state transitions
 */

import logger from "../utils/logger";
import { WorkOrderStatus, GeoPoint } from "../types/entities";
import workOrderRepository from "../repositories/WorkOrderRepository";
import incidentRepository from "../repositories/IncidentRepository";
import { getWebSocketService } from "./WebSocketService";

/**
 * Simulated field unit
 */
interface FieldUnit {
  id: string;
  name: string;
  location: GeoPoint;
  zoneId: string;
  available: boolean;
}

/**
 * Work order simulation configuration
 */
interface SimulationConfig {
  travelSpeedKmh: number; // Average travel speed
  workDurationMultiplier: number; // Multiplier for work duration estimation
}

/**
 * WorkOrderSimulator class manages work order lifecycle simulation
 */
export class WorkOrderSimulator {
  private activeSimulations: Map<string, NodeJS.Timeout>;
  private fieldUnits: Map<string, FieldUnit>;
  private config: SimulationConfig;

  constructor() {
    this.activeSimulations = new Map();
    this.fieldUnits = new Map();
    this.config = {
      travelSpeedKmh: 40, // 40 km/h average speed in city
      workDurationMultiplier: 1.0,
    };

    // Initialize some mock field units
    this.initializeFieldUnits();
  }

  /**
   * Initialize mock field units for simulation
   */
  private initializeFieldUnits(): void {
    const units: FieldUnit[] = [
      {
        id: "unit-001",
        name: "Maintenance Team Alpha",
        location: { type: "Point", coordinates: [-122.4194, 37.7749] },
        zoneId: "zone-1",
        available: true,
      },
      {
        id: "unit-002",
        name: "Maintenance Team Beta",
        location: { type: "Point", coordinates: [-122.4094, 37.7849] },
        zoneId: "zone-2",
        available: true,
      },
      {
        id: "unit-003",
        name: "Emergency Response Unit",
        location: { type: "Point", coordinates: [-122.4294, 37.7649] },
        zoneId: "zone-1",
        available: true,
      },
      {
        id: "unit-004",
        name: "Maintenance Team Gamma",
        location: { type: "Point", coordinates: [-122.3994, 37.7949] },
        zoneId: "zone-3",
        available: true,
      },
      {
        id: "unit-005",
        name: "Maintenance Team Delta",
        location: { type: "Point", coordinates: [-122.4394, 37.7549] },
        zoneId: "zone-2",
        available: true,
      },
    ];

    units.forEach((unit) => {
      this.fieldUnits.set(unit.id, unit);
    });

    logger.info("Field units initialized", { count: units.length });
  }

  /**
   * Find available unit closest to the incident location
   */
  findAvailableUnit(
    location: GeoPoint,
    zoneId?: string
  ): FieldUnit | undefined {
    const availableUnits = Array.from(this.fieldUnits.values()).filter(
      (unit) => unit.available
    );

    if (availableUnits.length === 0) {
      return undefined;
    }

    // Prefer units in the same zone
    const sameZoneUnits = availableUnits.filter(
      (unit) => unit.zoneId === zoneId
    );
    const unitsToSearch =
      sameZoneUnits.length > 0 ? sameZoneUnits : availableUnits;

    // Find closest unit
    let closestUnit = unitsToSearch[0];
    let minDistance = this.calculateDistance(location, closestUnit.location);

    for (const unit of unitsToSearch.slice(1)) {
      const distance = this.calculateDistance(location, unit.location);
      if (distance < minDistance) {
        minDistance = distance;
        closestUnit = unit;
      }
    }

    return closestUnit;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Earth's radius in km
    const lat1 = (point1.coordinates[1] * Math.PI) / 180;
    const lat2 = (point2.coordinates[1] * Math.PI) / 180;
    const deltaLat =
      ((point2.coordinates[1] - point1.coordinates[1]) * Math.PI) / 180;
    const deltaLon =
      ((point2.coordinates[0] - point1.coordinates[0]) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate travel time in milliseconds
   */
  calculateTravelTime(
    unitLocation: GeoPoint,
    incidentLocation: GeoPoint
  ): number {
    const distanceKm = this.calculateDistance(unitLocation, incidentLocation);
    const travelTimeHours = distanceKm / this.config.travelSpeedKmh;
    const travelTimeMs = travelTimeHours * 60 * 60 * 1000;

    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    return Math.round(travelTimeMs * randomFactor);
  }

  /**
   * Estimate work duration based on incident type
   * Returns duration in milliseconds
   */
  estimateWorkDuration(incidentType: string): number {
    const baseDurations: Record<string, number> = {
      WASTE_OVERFLOW: 15 * 60 * 1000, // 15 minutes
      LIGHTING_FAILURE: 30 * 60 * 1000, // 30 minutes
      WATER_ANOMALY: 60 * 60 * 1000, // 1 hour
      WATER_LEAK: 60 * 60 * 1000, // 1 hour
      TRAFFIC_CONGESTION: 45 * 60 * 1000, // 45 minutes
      TRAFFIC_SIGNAL: 45 * 60 * 1000, // 45 minutes
      ENVIRONMENTAL_HAZARD: 90 * 60 * 1000, // 1.5 hours
      ENVIRONMENTAL: 90 * 60 * 1000, // 1.5 hours
      NOISE_COMPLAINT: 20 * 60 * 1000, // 20 minutes
      NOISE: 20 * 60 * 1000, // 20 minutes
    };

    const baseDuration = baseDurations[incidentType] || 30 * 60 * 1000;

    // Add some randomness (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6;
    return Math.round(
      baseDuration * randomFactor * this.config.workDurationMultiplier
    );
  }

  /**
   * Simulate work order lifecycle
   */
  async simulateWorkOrder(workOrderId: string): Promise<void> {
    try {
      // Get work order
      const workOrder = await workOrderRepository.findById(workOrderId);
      if (!workOrder) {
        logger.error("Work order not found for simulation", { workOrderId });
        return;
      }

      logger.info("Starting work order simulation", {
        workOrderId,
        status: workOrder.status,
      });

      // If already assigned, find the unit
      let unit: FieldUnit | undefined;
      if (workOrder.assignedUnitId) {
        unit = this.fieldUnits.get(workOrder.assignedUnitId);
      }

      // If not assigned or unit not found, find available unit
      if (!unit) {
        unit = this.findAvailableUnit(workOrder.location, workOrder.zoneId);
        if (!unit) {
          logger.warn("No available units for work order", { workOrderId });
          return;
        }

        // Assign to unit
        unit.available = false;
        await workOrderRepository.assignToUnit(workOrderId, unit.id);
        logger.info("Work order assigned to unit", {
          workOrderId,
          unitId: unit.id,
        });

        // Broadcast assignment
        this.broadcastWorkOrderUpdate(workOrderId, "ASSIGNED");
      }

      // Calculate travel time
      const travelTime = this.calculateTravelTime(
        unit.location,
        workOrder.location
      );

      logger.info("Unit traveling to incident", {
        workOrderId,
        unitId: unit.id,
        travelTimeMinutes: Math.round(travelTime / 60000),
      });

      // Wait for travel time
      await this.delay(travelTime);

      // Start work
      await workOrderRepository.updateStatus(workOrderId, "IN_PROGRESS");
      logger.info("Work order in progress", { workOrderId });
      this.broadcastWorkOrderUpdate(workOrderId, "IN_PROGRESS");

      // Get incident type for work duration estimation
      const incident = workOrder.incidentId
        ? await incidentRepository.findById(workOrder.incidentId)
        : null;
      const incidentType = incident?.category || "UNKNOWN";

      // Calculate work duration
      const workDuration = this.estimateWorkDuration(incidentType);

      logger.info("Unit working on incident", {
        workOrderId,
        workDurationMinutes: Math.round(workDuration / 60000),
      });

      // Wait for work duration
      await this.delay(workDuration);

      // Complete work
      await workOrderRepository.updateStatus(workOrderId, "COMPLETED");
      logger.info("Work order completed", { workOrderId });
      this.broadcastWorkOrderUpdate(workOrderId, "COMPLETED");

      // Mark unit as available again
      unit.available = true;

      // Resolve associated incident
      if (workOrder.incidentId) {
        await incidentRepository.update(workOrder.incidentId, {
          status: "RESOLVED",
          resolvedAt: new Date(),
        });
        logger.info("Incident resolved", { incidentId: workOrder.incidentId });

        // Broadcast incident resolution
        const wsService = getWebSocketService();
        if (wsService) {
          wsService.broadcast("incident:resolved", {
            incidentId: workOrder.incidentId,
          });
        }
      }

      // Clean up simulation
      this.activeSimulations.delete(workOrderId);
    } catch (error) {
      logger.error("Error simulating work order", {
        workOrderId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Clean up on error
      this.activeSimulations.delete(workOrderId);
    }
  }

  /**
   * Start work order simulation (non-blocking)
   */
  startSimulation(workOrderId: string): void {
    // Don't start if already simulating
    if (this.activeSimulations.has(workOrderId)) {
      logger.warn("Work order simulation already active", { workOrderId });
      return;
    }

    // Start simulation in background
    this.simulateWorkOrder(workOrderId);

    // Mark as active (we'll clean up when done)
    this.activeSimulations.set(
      workOrderId,
      setTimeout(() => {}, 0)
    );
  }

  /**
   * Cancel work order simulation
   */
  async cancelSimulation(workOrderId: string): Promise<void> {
    const timeout = this.activeSimulations.get(workOrderId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeSimulations.delete(workOrderId);
    }

    // Update work order status
    await workOrderRepository.updateStatus(workOrderId, "CANCELLED");
    this.broadcastWorkOrderUpdate(workOrderId, "CANCELLED");

    logger.info("Work order simulation cancelled", { workOrderId });
  }

  /**
   * Broadcast work order update via WebSocket
   */
  private async broadcastWorkOrderUpdate(
    workOrderId: string,
    _status: WorkOrderStatus
  ): Promise<void> {
    try {
      const workOrder = await workOrderRepository.findById(workOrderId);
      if (!workOrder) {
        return;
      }

      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcast("workorder:updated", workOrder);
      }
    } catch (error) {
      logger.error("Error broadcasting work order update", {
        workOrderId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delay helper for async/await
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all field units
   */
  getFieldUnits(): FieldUnit[] {
    return Array.from(this.fieldUnits.values());
  }

  /**
   * Get available field units
   */
  getAvailableUnits(): FieldUnit[] {
    return Array.from(this.fieldUnits.values()).filter(
      (unit) => unit.available
    );
  }

  /**
   * Get active simulations count
   */
  getActiveSimulationsCount(): number {
    return this.activeSimulations.size;
  }

  /**
   * Shutdown simulator
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down work order simulator", {
      activeSimulations: this.activeSimulations.size,
    });

    // Clear all active simulations
    for (const timeout of this.activeSimulations.values()) {
      clearTimeout(timeout);
    }
    this.activeSimulations.clear();

    // Mark all units as available
    for (const unit of this.fieldUnits.values()) {
      unit.available = true;
    }
  }
}

// Export singleton instance
export default new WorkOrderSimulator();
