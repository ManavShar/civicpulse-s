/**
 * Sensor simulation configuration and types
 */

import { SensorType, GeoPoint } from "./entities";

/**
 * Sensor configuration for simulation
 */
export interface SensorConfig {
  id: string;
  name: string;
  type: SensorType;
  location: GeoPoint;
  zoneId: string;
  baseValue: number;
  unit: string;
  noise: number; // Standard deviation for Gaussian noise
  interval: number; // Milliseconds between readings
  anomalyProbability: number; // 0.0 to 1.0
  thresholds: {
    min: number;
    max: number;
    warning: number;
    critical: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Sensor status
 */
export type SensorStatus = "online" | "offline" | "warning";

/**
 * Sensor reading with simulation metadata
 */
export interface SimulatedSensorReading {
  sensorId: string;
  timestamp: Date;
  value: number;
  unit: string;
  isAnomaly: boolean;
  metadata?: Record<string, any>;
}

/**
 * Scenario modifier for sensor behavior
 */
export interface ScenarioModifier {
  sensorType?: SensorType;
  sensorId?: string;
  modifier: (baseValue: number) => number;
  description: string;
}

/**
 * Sensor state for tracking simulation
 */
export interface SensorState {
  id: string;
  status: SensorStatus;
  lastReading?: SimulatedSensorReading;
  lastReadingTime?: Date;
  intervalHandle?: NodeJS.Timeout;
}

/**
 * Default sensor configurations by type
 */
export const DEFAULT_SENSOR_CONFIGS: Record<
  SensorType,
  Omit<SensorConfig, "id" | "name" | "location" | "zoneId">
> = {
  WASTE: {
    type: "WASTE",
    baseValue: 50, // Percentage full
    unit: "%",
    noise: 5,
    interval: 10000, // 10 seconds
    anomalyProbability: 0.05,
    thresholds: {
      min: 0,
      max: 100,
      warning: 75,
      critical: 90,
    },
  },
  LIGHT: {
    type: "LIGHT",
    baseValue: 100, // Lux
    unit: "lux",
    noise: 10,
    interval: 15000, // 15 seconds
    anomalyProbability: 0.03,
    thresholds: {
      min: 0,
      max: 500,
      warning: 50,
      critical: 20,
    },
  },
  WATER: {
    type: "WATER",
    baseValue: 3.5, // Bar pressure
    unit: "bar",
    noise: 0.2,
    interval: 8000, // 8 seconds
    anomalyProbability: 0.04,
    thresholds: {
      min: 0,
      max: 10,
      warning: 2.0,
      critical: 1.5,
    },
  },
  TRAFFIC: {
    type: "TRAFFIC",
    baseValue: 30, // Vehicles per minute
    unit: "vpm",
    noise: 8,
    interval: 20000, // 20 seconds
    anomalyProbability: 0.06,
    thresholds: {
      min: 0,
      max: 200,
      warning: 80,
      critical: 120,
    },
  },
  ENVIRONMENT: {
    type: "ENVIRONMENT",
    baseValue: 22, // Temperature in Celsius
    unit: "°C",
    noise: 2,
    interval: 30000, // 30 seconds
    anomalyProbability: 0.02,
    thresholds: {
      min: -20,
      max: 50,
      warning: 35,
      critical: 40,
    },
  },
  NOISE: {
    type: "NOISE",
    baseValue: 55, // Decibels
    unit: "dB",
    noise: 5,
    interval: 12000, // 12 seconds
    anomalyProbability: 0.05,
    thresholds: {
      min: 0,
      max: 120,
      warning: 75,
      critical: 85,
    },
  },
};
