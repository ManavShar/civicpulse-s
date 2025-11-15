/**
 * Sensor Service managing sensor simulations and data streaming
 */

import { SensorSimulator } from "./SensorSimulator";
import {
  SensorConfig,
  SimulatedSensorReading,
} from "../types/sensor-simulation";
import { Sensor, SensorReading } from "../types/entities";
import SensorRepository from "../repositories/SensorRepository";
import SensorReadingRepository from "../repositories/SensorReadingRepository";
import { getWebSocketService } from "./WebSocketService";
import logger from "../utils/logger";
import { DEFAULT_SENSOR_CONFIGS } from "../types/sensor-simulation";
import incidentService from "./IncidentService";

/**
 * SensorService manages all sensor simulations
 */
export class SensorService {
  private simulator: SensorSimulator;
  private activeSensors: Map<string, SensorConfig> = new Map();
  private readingBuffer: SimulatedSensorReading[] = [];
  private batchInsertInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL_MS = 5000; // 5 seconds

  constructor(simulator: SensorSimulator) {
    this.simulator = simulator;
  }

  /**
   * Initialize sensor service and start batch insert timer
   */
  async initialize(): Promise<void> {
    // Start batch insert timer
    this.batchInsertInterval = setInterval(() => {
      this.flushReadingBuffer();
    }, this.BATCH_INTERVAL_MS);

    logger.info("SensorService initialized");
  }

  /**
   * Load sensors from database and create configurations
   */
  async loadSensors(): Promise<void> {
    try {
      const sensors = await SensorRepository.findAll();

      for (const sensor of sensors) {
        const config = this.createSensorConfig(sensor);
        this.activeSensors.set(sensor.id, config);
        this.simulator.initializeSensorState(config);
      }

      logger.info("Sensors loaded", { count: sensors.length });
    } catch (error) {
      logger.error("Failed to load sensors", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Create sensor configuration from database sensor
   */
  private createSensorConfig(sensor: Sensor): SensorConfig {
    const defaultConfig = DEFAULT_SENSOR_CONFIGS[sensor.type];

    // Merge database config with defaults
    const config: SensorConfig = {
      ...defaultConfig,
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      zoneId: sensor.zoneId,
      ...(sensor.config || {}),
    };

    return config;
  }

  /**
   * Start simulation for a specific sensor
   */
  startSimulation(sensorId: string): void {
    const config = this.activeSensors.get(sensorId);
    if (!config) {
      logger.warn("Attempted to start simulation for unknown sensor", {
        sensorId,
      });
      return;
    }

    // Check if already running
    const state = this.simulator.getSensorState(sensorId);
    if (state?.intervalHandle) {
      logger.debug("Simulation already running for sensor", { sensorId });
      return;
    }

    // Start interval
    const intervalHandle = setInterval(() => {
      this.generateAndBroadcastReading(config);
    }, config.interval);

    // Update state with interval handle
    const sensorState = this.simulator.getSensorState(sensorId);
    if (sensorState) {
      sensorState.intervalHandle = intervalHandle;
    }

    // Generate initial reading immediately
    this.generateAndBroadcastReading(config);

    logger.info("Started sensor simulation", {
      sensorId,
      interval: config.interval,
    });
  }

  /**
   * Stop simulation for a specific sensor
   */
  stopSimulation(sensorId: string): void {
    const state = this.simulator.getSensorState(sensorId);
    if (state?.intervalHandle) {
      clearInterval(state.intervalHandle);
      state.intervalHandle = undefined;
      logger.info("Stopped sensor simulation", { sensorId });
    }
  }

  /**
   * Start all sensor simulations
   */
  startAllSimulations(): void {
    for (const sensorId of this.activeSensors.keys()) {
      this.startSimulation(sensorId);
    }
    logger.info("Started all sensor simulations", {
      count: this.activeSensors.size,
    });
  }

  /**
   * Stop all sensor simulations
   */
  stopAllSimulations(): void {
    for (const sensorId of this.activeSensors.keys()) {
      this.stopSimulation(sensorId);
    }
    logger.info("Stopped all sensor simulations");
  }

  /**
   * Generate reading and broadcast via WebSocket
   */
  private generateAndBroadcastReading(config: SensorConfig): void {
    try {
      // Generate reading
      const reading = this.simulator.generateReading(config);

      // Add to buffer for batch insert
      this.readingBuffer.push(reading);

      // Broadcast via WebSocket
      this.broadcastReading(reading);

      // Check if anomaly detected
      if (reading.isAnomaly) {
        this.broadcastAnomaly(reading);
      }

      // Flush buffer if it reaches batch size
      if (this.readingBuffer.length >= this.BATCH_SIZE) {
        this.flushReadingBuffer();
      }
    } catch (error) {
      logger.error("Error generating sensor reading", {
        sensorId: config.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Broadcast sensor reading via WebSocket
   */
  private broadcastReading(reading: SimulatedSensorReading): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("sensor:reading", {
        sensorId: reading.sensorId,
        timestamp: reading.timestamp,
        value: reading.value,
        unit: reading.unit,
        metadata: reading.metadata,
      });
    } catch (error) {
      // WebSocket service might not be initialized yet
      logger.debug("Could not broadcast reading", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Broadcast anomaly detection via WebSocket
   */
  private broadcastAnomaly(reading: SimulatedSensorReading): void {
    try {
      const wsService = getWebSocketService();
      wsService.broadcast("sensor:anomaly", {
        sensorId: reading.sensorId,
        reading: {
          timestamp: reading.timestamp,
          value: reading.value,
          unit: reading.unit,
        },
      });

      logger.info("Anomaly detected and broadcast", {
        sensorId: reading.sensorId,
        value: reading.value,
      });
    } catch (error) {
      logger.debug("Could not broadcast anomaly", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Flush reading buffer to database
   */
  private async flushReadingBuffer(): Promise<void> {
    if (this.readingBuffer.length === 0) {
      return;
    }

    const readingsToInsert = [...this.readingBuffer];
    this.readingBuffer = [];

    try {
      // Convert to database format
      const dbReadings = readingsToInsert.map((r) => ({
        sensorId: r.sensorId,
        timestamp: r.timestamp,
        value: r.value,
        unit: r.unit,
        metadata: r.metadata,
      }));

      // Batch insert
      await SensorReadingRepository.batchInsert(dbReadings);

      // Process readings for incident detection
      // Note: We process the simulated readings since they have all the data we need
      for (const reading of readingsToInsert) {
        // Convert to SensorReading format for incident detection
        const sensorReading = {
          id: "", // Will be set by database, not needed for detection
          sensorId: reading.sensorId,
          timestamp: reading.timestamp,
          value: reading.value,
          unit: reading.unit,
          metadata: reading.metadata,
          createdAt: new Date(),
        };

        // Process asynchronously without blocking
        incidentService.processReading(sensorReading).catch((error) => {
          logger.error("Error processing reading for incident detection", {
            sensorId: reading.sensorId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        });
      }

      logger.debug("Flushed sensor readings to database", {
        count: readingsToInsert.length,
      });
    } catch (error) {
      logger.error("Failed to flush sensor readings", {
        count: readingsToInsert.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Re-add to buffer to retry
      this.readingBuffer.unshift(...readingsToInsert);
    }
  }

  /**
   * Get sensor by ID
   */
  async getSensor(sensorId: string): Promise<Sensor | null> {
    try {
      return await SensorRepository.findById(sensorId);
    } catch (error) {
      logger.error("Failed to get sensor", {
        sensorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get all sensors
   */
  async getAllSensors(): Promise<Sensor[]> {
    try {
      return await SensorRepository.findAll();
    } catch (error) {
      logger.error("Failed to get all sensors", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get sensor readings
   */
  async getSensorReadings(
    sensorId: string,
    limit: number = 100
  ): Promise<SensorReading[]> {
    try {
      return await SensorReadingRepository.findBySensor(sensorId, limit);
    } catch (error) {
      logger.error("Failed to get sensor readings", {
        sensorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get sensor readings in time range
   */
  async getSensorReadingsInRange(
    sensorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<SensorReading[]> {
    try {
      return await SensorReadingRepository.findByTimeRange(
        sensorId,
        startTime,
        endTime
      );
    } catch (error) {
      logger.error("Failed to get sensor readings in range", {
        sensorId,
        startTime,
        endTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get sensor configuration
   */
  getSensorConfig(sensorId: string): SensorConfig | undefined {
    return this.activeSensors.get(sensorId);
  }

  /**
   * Update sensor configuration
   */
  updateSensorConfig(sensorId: string, updates: Partial<SensorConfig>): void {
    const config = this.activeSensors.get(sensorId);
    if (config) {
      Object.assign(config, updates);
      logger.info("Updated sensor configuration", { sensorId, updates });
    }
  }

  /**
   * Get sensor simulator instance
   */
  getSimulator(): SensorSimulator {
    return this.simulator;
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    // Stop all simulations
    this.stopAllSimulations();

    // Clear batch insert interval
    if (this.batchInsertInterval) {
      clearInterval(this.batchInsertInterval);
      this.batchInsertInterval = null;
    }

    // Flush remaining readings
    await this.flushReadingBuffer();

    logger.info("SensorService shut down");
  }
}

// Create singleton instance
const sensorService = new SensorService(require("./SensorSimulator").default);

export default sensorService;
