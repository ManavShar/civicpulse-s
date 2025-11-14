/**
 * Sensor data generation and simulation logic
 */

import {
  SensorConfig,
  SimulatedSensorReading,
  ScenarioModifier,
  SensorState,
  SensorStatus,
} from "../types/sensor-simulation";
import logger from "../utils/logger";

/**
 * SensorSimulator class handles sensor data generation with realistic patterns
 */
export class SensorSimulator {
  private sensorStates: Map<string, SensorState> = new Map();
  private activeScenarioModifiers: ScenarioModifier[] = [];

  /**
   * Generate Gaussian (normal) distributed random noise
   * Uses Box-Muller transform
   */
  private generateGaussianNoise(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Apply time-of-day variation to sensor values
   * Creates realistic daily patterns
   */
  private applyTimeOfDayVariation(
    baseValue: number,
    sensorConfig: SensorConfig
  ): number {
    const now = new Date();
    const hour = now.getHours();

    // Different patterns for different sensor types
    switch (sensorConfig.type) {
      case "TRAFFIC":
        // Peak during rush hours (7-9 AM, 5-7 PM)
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          return baseValue * 1.8;
        } else if (hour >= 22 || hour <= 5) {
          // Low traffic at night
          return baseValue * 0.3;
        }
        return baseValue;

      case "WASTE":
        // Gradually fills throughout the day
        const hoursSinceMidnight = hour + now.getMinutes() / 60;
        const fillRate = hoursSinceMidnight / 24;
        return baseValue + fillRate * 30; // Can increase up to 30% throughout day

      case "LIGHT":
        // Lower during day, higher at night
        if (hour >= 6 && hour <= 18) {
          return baseValue * 2.5; // Bright during day
        }
        return baseValue * 0.5; // Dim at night

      case "NOISE":
        // Higher during day, lower at night
        if (hour >= 8 && hour <= 20) {
          return baseValue * 1.3;
        }
        return baseValue * 0.6;

      case "ENVIRONMENT":
        // Temperature variation throughout day
        const tempVariation = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 5;
        return baseValue + tempVariation;

      case "WATER":
        // Higher usage during morning and evening
        if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) {
          return baseValue * 0.85; // Lower pressure during high usage
        }
        return baseValue;

      default:
        return baseValue;
    }
  }

  /**
   * Apply scenario modifiers to sensor value
   */
  private applyScenarioModifiers(
    value: number,
    sensorConfig: SensorConfig
  ): number {
    let modifiedValue = value;

    for (const modifier of this.activeScenarioModifiers) {
      // Check if modifier applies to this sensor
      if (
        modifier.sensorType === sensorConfig.type ||
        modifier.sensorId === sensorConfig.id
      ) {
        modifiedValue = modifier.modifier(modifiedValue);
        logger.debug("Applied scenario modifier", {
          sensorId: sensorConfig.id,
          modifier: modifier.description,
          originalValue: value,
          modifiedValue,
        });
      }
    }

    return modifiedValue;
  }

  /**
   * Inject anomaly based on probability
   */
  private maybeInjectAnomaly(
    value: number,
    sensorConfig: SensorConfig
  ): { value: number; isAnomaly: boolean } {
    const shouldInjectAnomaly = Math.random() < sensorConfig.anomalyProbability;

    if (!shouldInjectAnomaly) {
      return { value, isAnomaly: false };
    }

    // Generate anomaly - either spike or drop
    const anomalyType = Math.random() < 0.5 ? "spike" : "drop";
    const anomalyMagnitude = 1.5 + Math.random() * 1.5; // 1.5x to 3x

    let anomalousValue: number;
    if (anomalyType === "spike") {
      anomalousValue = value * anomalyMagnitude;
    } else {
      anomalousValue = value / anomalyMagnitude;
    }

    // Clamp to sensor thresholds
    anomalousValue = Math.max(
      sensorConfig.thresholds.min,
      Math.min(sensorConfig.thresholds.max, anomalousValue)
    );

    logger.info("Anomaly injected", {
      sensorId: sensorConfig.id,
      type: anomalyType,
      normalValue: value,
      anomalousValue,
    });

    return { value: anomalousValue, isAnomaly: true };
  }

  /**
   * Generate a single sensor reading
   */
  generateReading(sensorConfig: SensorConfig): SimulatedSensorReading {
    // Start with base value
    let value = sensorConfig.baseValue;

    // Apply time-of-day variation
    value = this.applyTimeOfDayVariation(value, sensorConfig);

    // Add Gaussian noise
    const noise = this.generateGaussianNoise(0, sensorConfig.noise);
    value += noise;

    // Apply scenario modifiers
    value = this.applyScenarioModifiers(value, sensorConfig);

    // Clamp to valid range before anomaly injection
    value = Math.max(
      sensorConfig.thresholds.min,
      Math.min(sensorConfig.thresholds.max, value)
    );

    // Maybe inject anomaly
    const { value: finalValue, isAnomaly } = this.maybeInjectAnomaly(
      value,
      sensorConfig
    );

    const reading: SimulatedSensorReading = {
      sensorId: sensorConfig.id,
      timestamp: new Date(),
      value: Math.round(finalValue * 100) / 100, // Round to 2 decimal places
      unit: sensorConfig.unit,
      isAnomaly,
      metadata: {
        baseValue: sensorConfig.baseValue,
        noise: Math.round(noise * 100) / 100,
        hasScenarioModifier: this.activeScenarioModifiers.length > 0,
      },
    };

    // Update sensor state
    const state = this.sensorStates.get(sensorConfig.id);
    if (state) {
      state.lastReading = reading;
      state.lastReadingTime = reading.timestamp;
      state.status = this.determineSensorStatus(reading, sensorConfig);
    }

    return reading;
  }

  /**
   * Determine sensor status based on reading
   */
  private determineSensorStatus(
    reading: SimulatedSensorReading,
    config: SensorConfig
  ): SensorStatus {
    if (reading.isAnomaly) {
      return "warning";
    }

    if (
      reading.value >= config.thresholds.warning ||
      reading.value <= config.thresholds.min * 1.1
    ) {
      return "warning";
    }

    return "online";
  }

  /**
   * Initialize sensor state
   */
  initializeSensorState(sensorConfig: SensorConfig): void {
    if (!this.sensorStates.has(sensorConfig.id)) {
      this.sensorStates.set(sensorConfig.id, {
        id: sensorConfig.id,
        status: "online",
      });
      logger.debug("Initialized sensor state", { sensorId: sensorConfig.id });
    }
  }

  /**
   * Get sensor state
   */
  getSensorState(sensorId: string): SensorState | undefined {
    return this.sensorStates.get(sensorId);
  }

  /**
   * Update sensor status
   */
  updateSensorStatus(sensorId: string, status: SensorStatus): void {
    const state = this.sensorStates.get(sensorId);
    if (state) {
      state.status = status;
      logger.info("Sensor status updated", { sensorId, status });
    }
  }

  /**
   * Add scenario modifier
   */
  addScenarioModifier(modifier: ScenarioModifier): void {
    this.activeScenarioModifiers.push(modifier);
    logger.info("Scenario modifier added", {
      description: modifier.description,
    });
  }

  /**
   * Clear all scenario modifiers
   */
  clearScenarioModifiers(): void {
    this.activeScenarioModifiers = [];
    logger.info("All scenario modifiers cleared");
  }

  /**
   * Get active scenario modifiers
   */
  getActiveModifiers(): ScenarioModifier[] {
    return [...this.activeScenarioModifiers];
  }

  /**
   * Clean up sensor state
   */
  removeSensorState(sensorId: string): void {
    const state = this.sensorStates.get(sensorId);
    if (state?.intervalHandle) {
      clearInterval(state.intervalHandle);
    }
    this.sensorStates.delete(sensorId);
    logger.debug("Removed sensor state", { sensorId });
  }

  /**
   * Get all sensor states
   */
  getAllSensorStates(): Map<string, SensorState> {
    return new Map(this.sensorStates);
  }
}

export default new SensorSimulator();
