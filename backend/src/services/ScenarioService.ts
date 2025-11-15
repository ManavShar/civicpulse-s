/**
 * Scenario Service managing demonstration scenario lifecycle
 */

import {
  ScenarioConfig,
  ActiveScenario,
  PREDEFINED_SCENARIOS,
  validateScenarioConfig,
  SensorModifier,
  TriggeredIncident,
} from "../types/scenario";
import { SensorConfig } from "../types/sensor-simulation";
import sensorService from "./SensorService";
import incidentService from "./IncidentService";
import { getWebSocketService } from "./WebSocketService";
import logger from "../utils/logger";
import { Severity } from "../types/entities";
import SensorRepository from "../repositories/SensorRepository";
import ZoneRepository from "../repositories/ZoneRepository";

/**
 * ScenarioService manages scenario lifecycle and execution
 */
export class ScenarioService {
  private activeScenario: ActiveScenario | null = null;
  private originalSensorConfigs: Map<string, Partial<SensorConfig>> = new Map();
  private scenarioTimeouts: NodeJS.Timeout[] = [];
  private scenarioEndTimeout: NodeJS.Timeout | null = null;

  /**
   * Get all available scenarios
   */
  getAvailableScenarios(): ScenarioConfig[] {
    return PREDEFINED_SCENARIOS.map((scenario) => ({
      ...scenario,
      // Don't send modifier functions to client
      sensorModifiers: scenario.sensorModifiers.map((m) => ({
        sensorType: m.sensorType,
        sensorId: m.sensorId,
        zoneId: m.zoneId,
        description: m.description,
        modifier: undefined as any, // Will be excluded in JSON
      })),
    }));
  }

  /**
   * Get scenario by ID
   */
  getScenarioById(scenarioId: string): ScenarioConfig | null {
    return PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId) || null;
  }

  /**
   * Get active scenario
   */
  getActiveScenario(): ActiveScenario | null {
    return this.activeScenario;
  }

  /**
   * Check if a scenario is currently active
   */
  isScenarioActive(): boolean {
    return this.activeScenario !== null;
  }

  /**
   * Trigger a scenario
   */
  async triggerScenario(scenarioId: string): Promise<ActiveScenario> {
    // Check if scenario already active
    if (this.activeScenario) {
      throw new Error(
        `Scenario "${this.activeScenario.config.name}" is already active. Stop it before starting a new one.`
      );
    }

    // Find scenario configuration
    const config = this.getScenarioById(scenarioId);
    if (!config) {
      throw new Error(`Scenario "${scenarioId}" not found`);
    }

    // Validate configuration
    const validation = validateScenarioConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid scenario configuration: ${validation.errors.join(", ")}`
      );
    }

    logger.info("Triggering scenario", {
      scenarioId: config.id,
      scenarioName: config.name,
      duration: config.duration,
    });

    // Calculate end time
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + config.duration);

    // Create active scenario
    this.activeScenario = {
      config,
      startTime,
      endTime,
      triggeredIncidentIds: [],
      status: "ACTIVE",
    };

    // Apply sensor modifiers
    await this.applySensorModifiers(config.sensorModifiers);

    // Schedule triggered incidents
    await this.scheduleTriggeredIncidents(config.triggeredIncidents);

    // Schedule scenario end
    this.scenarioEndTimeout = setTimeout(() => {
      this.stopScenario();
    }, config.duration);

    // Broadcast scenario started event
    this.broadcastScenarioEvent("scenario:started", {
      scenario: {
        id: config.id,
        name: config.name,
        description: config.description,
        duration: config.duration,
        startTime,
        endTime,
      },
    });

    logger.info("Scenario triggered successfully", {
      scenarioId: config.id,
      endTime,
    });

    return this.activeScenario;
  }

  /**
   * Apply sensor modifiers to matching sensors
   */
  private async applySensorModifiers(
    modifiers: SensorModifier[]
  ): Promise<void> {
    try {
      // Get all sensors
      const sensors = await SensorRepository.findAll();

      for (const modifier of modifiers) {
        // Find matching sensors
        const matchingSensors = sensors.filter((sensor) => {
          if (modifier.sensorId) {
            return sensor.id === modifier.sensorId;
          }
          if (modifier.sensorType) {
            return sensor.type === modifier.sensorType;
          }
          if (modifier.zoneId) {
            return sensor.zoneId === modifier.zoneId;
          }
          return false;
        });

        // Apply modifier to each matching sensor
        for (const sensor of matchingSensors) {
          const config = sensorService.getSensorConfig(sensor.id);
          if (config) {
            // Store original config if not already stored
            if (!this.originalSensorConfigs.has(sensor.id)) {
              this.originalSensorConfigs.set(sensor.id, {
                baseValue: config.baseValue,
                anomalyProbability: config.anomalyProbability,
              });
            }

            // Apply modifier to base value
            const originalBaseValue =
              this.originalSensorConfigs.get(sensor.id)?.baseValue ||
              config.baseValue;
            const modifiedBaseValue = modifier.modifier(originalBaseValue);

            // Update sensor config
            sensorService.updateSensorConfig(sensor.id, {
              baseValue: modifiedBaseValue,
              // Increase anomaly probability during scenarios
              anomalyProbability: Math.min(config.anomalyProbability * 2, 0.3),
            });

            logger.debug("Applied sensor modifier", {
              sensorId: sensor.id,
              sensorType: sensor.type,
              originalValue: originalBaseValue,
              modifiedValue: modifiedBaseValue,
              description: modifier.description,
            });
          }
        }

        logger.info("Sensor modifier applied", {
          modifier: modifier.description,
          affectedSensors: matchingSensors.length,
        });
      }
    } catch (error) {
      logger.error("Error applying sensor modifiers", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Schedule triggered incidents
   */
  private async scheduleTriggeredIncidents(
    incidents: TriggeredIncident[]
  ): Promise<void> {
    for (const incidentTemplate of incidents) {
      const timeout = setTimeout(async () => {
        try {
          await this.createTriggeredIncident(incidentTemplate);
        } catch (error) {
          logger.error("Error creating triggered incident", {
            incident: incidentTemplate.type,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }, incidentTemplate.delay);

      this.scenarioTimeouts.push(timeout);

      logger.debug("Scheduled triggered incident", {
        type: incidentTemplate.type,
        delay: incidentTemplate.delay,
      });
    }
  }

  /**
   * Create a triggered incident
   */
  private async createTriggeredIncident(
    template: TriggeredIncident
  ): Promise<void> {
    try {
      // Find a sensor to associate with the incident
      let sensorId: string | undefined;
      let location = template.location;
      let zoneId = template.zoneId;

      if (!location || !zoneId) {
        // Find a sensor in the specified zone or any zone
        const sensors = await SensorRepository.findAll();
        const matchingSensor = template.zoneId
          ? sensors.find((s) => s.zoneId === template.zoneId)
          : sensors[0];

        if (matchingSensor) {
          sensorId = matchingSensor.id;
          location = matchingSensor.location;
          zoneId = matchingSensor.zoneId;
        } else {
          // Fallback: use first zone
          const zones = await ZoneRepository.findAll();
          if (zones.length > 0) {
            zoneId = zones[0].id;
            // Create a location in the center of the zone
            location = {
              type: "Point",
              coordinates: [0, 0], // Simplified - would calculate centroid in production
            };
          } else {
            logger.warn("No zones found for triggered incident", {
              type: template.type,
            });
            return;
          }
        }
      }

      if (!location || !zoneId) {
        logger.warn("Could not determine location or zone for incident", {
          type: template.type,
        });
        return;
      }

      // Create incident
      const incident = await incidentService.createIncident({
        type: template.type,
        category: template.category,
        severity: (template.severity || "MEDIUM") as Severity,
        status: "ACTIVE",
        priorityScore: this.calculatePriorityScore(
          template.severity || "MEDIUM"
        ),
        confidence: 0.95, // High confidence for scenario-triggered incidents
        location,
        zoneId,
        sensorId,
        description: template.description,
        detectedAt: new Date(),
        metadata: {
          scenarioTriggered: true,
          scenarioId: this.activeScenario?.config.id,
        },
      });

      // Store incident ID
      if (this.activeScenario) {
        this.activeScenario.triggeredIncidentIds.push(incident.id);
      }

      logger.info("Triggered incident created", {
        incidentId: incident.id,
        type: template.type,
        category: template.category,
        severity: template.severity,
      });
    } catch (error) {
      logger.error("Failed to create triggered incident", {
        template,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Calculate priority score based on severity
   */
  private calculatePriorityScore(severity: string): number {
    const scores: Record<string, number> = {
      LOW: 30,
      MEDIUM: 50,
      HIGH: 75,
      CRITICAL: 95,
    };
    return scores[severity] || 50;
  }

  /**
   * Stop the active scenario
   */
  stopScenario(): void {
    if (!this.activeScenario) {
      logger.warn("No active scenario to stop");
      return;
    }

    logger.info("Stopping scenario", {
      scenarioId: this.activeScenario.config.id,
      scenarioName: this.activeScenario.config.name,
    });

    // Clear all scheduled timeouts
    this.scenarioTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.scenarioTimeouts = [];

    if (this.scenarioEndTimeout) {
      clearTimeout(this.scenarioEndTimeout);
      this.scenarioEndTimeout = null;
    }

    // Restore original sensor configurations
    this.restoreSensorConfigs();

    // Update scenario status
    const stoppedScenario = this.activeScenario;
    stoppedScenario.status = "STOPPED";

    // Clear active scenario
    this.activeScenario = null;

    // Broadcast scenario stopped event
    this.broadcastScenarioEvent("scenario:stopped", {
      scenario: {
        id: stoppedScenario.config.id,
        name: stoppedScenario.config.name,
        startTime: stoppedScenario.startTime,
        endTime: new Date(),
        triggeredIncidents: stoppedScenario.triggeredIncidentIds.length,
      },
    });

    logger.info("Scenario stopped successfully", {
      scenarioId: stoppedScenario.config.id,
      triggeredIncidents: stoppedScenario.triggeredIncidentIds.length,
    });
  }

  /**
   * Restore original sensor configurations
   */
  private restoreSensorConfigs(): void {
    for (const [sensorId, originalConfig] of this.originalSensorConfigs) {
      try {
        sensorService.updateSensorConfig(sensorId, originalConfig);
        logger.debug("Restored sensor configuration", {
          sensorId,
          originalConfig,
        });
      } catch (error) {
        logger.error("Error restoring sensor configuration", {
          sensorId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Clear stored configs
    this.originalSensorConfigs.clear();

    logger.info("Sensor configurations restored to normal");
  }

  /**
   * Broadcast scenario event via WebSocket
   */
  private broadcastScenarioEvent(event: string, data: any): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast(event, data);
    } catch (error) {
      logger.debug("Could not broadcast scenario event", {
        event,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get scenario status
   */
  getScenarioStatus(): {
    active: boolean;
    scenario?: {
      id: string;
      name: string;
      description: string;
      startTime: Date;
      endTime: Date;
      elapsedTime: number;
      remainingTime: number;
      triggeredIncidents: number;
    };
  } {
    if (!this.activeScenario) {
      return { active: false };
    }

    const now = new Date();
    const elapsedTime = now.getTime() - this.activeScenario.startTime.getTime();
    const remainingTime = Math.max(
      0,
      this.activeScenario.endTime.getTime() - now.getTime()
    );

    return {
      active: true,
      scenario: {
        id: this.activeScenario.config.id,
        name: this.activeScenario.config.name,
        description: this.activeScenario.config.description,
        startTime: this.activeScenario.startTime,
        endTime: this.activeScenario.endTime,
        elapsedTime,
        remainingTime,
        triggeredIncidents: this.activeScenario.triggeredIncidentIds.length,
      },
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.activeScenario) {
      this.stopScenario();
    }
    logger.info("ScenarioService shut down");
  }
}

// Create singleton instance
const scenarioService = new ScenarioService();

export default scenarioService;
