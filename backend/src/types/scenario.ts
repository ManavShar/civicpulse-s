/**
 * Scenario types and configurations for demonstration system
 */

import { SensorType, IncidentCategory, GeoPoint } from "./entities";

/**
 * Sensor modifier function type
 */
export type SensorModifierFunction = (baseValue: number) => number;

/**
 * Sensor modifier configuration
 */
export interface SensorModifier {
  sensorType?: SensorType;
  sensorId?: string;
  zoneId?: string;
  modifier: SensorModifierFunction;
  description: string;
}

/**
 * Triggered incident template
 */
export interface TriggeredIncident {
  type: string;
  category: IncidentCategory;
  description: string;
  zoneId?: string;
  location?: GeoPoint;
  delay: number; // milliseconds after scenario trigger
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Scenario configuration
 */
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  duration: number; // milliseconds
  sensorModifiers: SensorModifier[];
  triggeredIncidents: TriggeredIncident[];
  metadata?: Record<string, any>;
}

/**
 * Active scenario state
 */
export interface ActiveScenario {
  config: ScenarioConfig;
  startTime: Date;
  endTime: Date;
  triggeredIncidentIds: string[];
  status: "ACTIVE" | "COMPLETED" | "STOPPED";
}

/**
 * Predefined scenario configurations
 */
export const PREDEFINED_SCENARIOS: ScenarioConfig[] = [
  {
    id: "flood",
    name: "Flash Flood Event",
    description:
      "Sudden heavy rainfall causing localized flooding in low-lying areas. Water levels rise rapidly, affecting drainage systems and creating hazardous conditions.",
    duration: 300000, // 5 minutes
    sensorModifiers: [
      {
        sensorType: "WATER",
        modifier: (v) => v * 2.5,
        description: "Water pressure increases significantly",
      },
      {
        sensorType: "ENVIRONMENT",
        modifier: (v) => v - 5,
        description: "Temperature drops due to heavy rain",
      },
      {
        sensorType: "TRAFFIC",
        modifier: (v) => v * 1.8,
        description: "Traffic congestion increases due to flooding",
      },
    ],
    triggeredIncidents: [
      {
        type: "FLOOD_WARNING",
        category: "WATER_ANOMALY",
        description: "Flash flood warning - water levels rising rapidly",
        delay: 30000, // 30 seconds
        severity: "CRITICAL",
      },
      {
        type: "ROAD_CLOSURE",
        category: "TRAFFIC_CONGESTION",
        description: "Road closure due to flooding",
        delay: 60000, // 1 minute
        severity: "HIGH",
      },
    ],
    metadata: {
      icon: "🌊",
      color: "#3B82F6",
    },
  },
  {
    id: "fire",
    name: "Fire Emergency",
    description:
      "Fire outbreak in commercial district requiring immediate response. High temperatures detected with smoke affecting air quality in surrounding areas.",
    duration: 240000, // 4 minutes
    sensorModifiers: [
      {
        sensorType: "ENVIRONMENT",
        modifier: (v) => v + 25,
        description: "Temperature spikes dramatically",
      },
      {
        sensorType: "NOISE",
        modifier: (v) => v + 30,
        description: "Noise levels increase from emergency response",
      },
      {
        sensorType: "TRAFFIC",
        modifier: (v) => v * 2.2,
        description: "Traffic increases around emergency zone",
      },
    ],
    triggeredIncidents: [
      {
        type: "FIRE_DETECTED",
        category: "ENVIRONMENTAL_HAZARD",
        description: "Fire detected - immediate evacuation required",
        delay: 15000, // 15 seconds
        severity: "CRITICAL",
      },
      {
        type: "AIR_QUALITY_ALERT",
        category: "ENVIRONMENTAL_HAZARD",
        description: "Poor air quality due to smoke",
        delay: 45000, // 45 seconds
        severity: "HIGH",
      },
      {
        type: "EMERGENCY_ROUTE",
        category: "TRAFFIC_CONGESTION",
        description: "Emergency vehicle route clearance needed",
        delay: 30000, // 30 seconds
        severity: "HIGH",
      },
    ],
    metadata: {
      icon: "🔥",
      color: "#EF4444",
    },
  },
  {
    id: "traffic-congestion",
    name: "Major Traffic Congestion",
    description:
      "Severe traffic congestion during peak hours causing gridlock across multiple zones. Increased vehicle density and reduced flow rates.",
    duration: 360000, // 6 minutes
    sensorModifiers: [
      {
        sensorType: "TRAFFIC",
        modifier: (v) => v * 3.5,
        description: "Traffic volume increases dramatically",
      },
      {
        sensorType: "NOISE",
        modifier: (v) => v + 20,
        description: "Noise pollution from congested traffic",
      },
      {
        sensorType: "ENVIRONMENT",
        modifier: (v) => v + 3,
        description: "Temperature rises from vehicle emissions",
      },
    ],
    triggeredIncidents: [
      {
        type: "GRIDLOCK",
        category: "TRAFFIC_CONGESTION",
        description: "Major gridlock - multiple intersections blocked",
        delay: 45000, // 45 seconds
        severity: "HIGH",
      },
      {
        type: "TRAFFIC_SIGNAL_FAILURE",
        category: "TRAFFIC_CONGESTION",
        description: "Traffic signal malfunction contributing to congestion",
        delay: 90000, // 1.5 minutes
        severity: "MEDIUM",
      },
    ],
    metadata: {
      icon: "🚗",
      color: "#F59E0B",
    },
  },
  {
    id: "heat-wave",
    name: "Extreme Heat Wave",
    description:
      "Prolonged period of excessive heat affecting public health and infrastructure. Increased demand on cooling systems and water resources.",
    duration: 420000, // 7 minutes
    sensorModifiers: [
      {
        sensorType: "ENVIRONMENT",
        modifier: (v) => v + 15,
        description: "Temperature reaches dangerous levels",
      },
      {
        sensorType: "WATER",
        modifier: (v) => v * 0.7,
        description: "Water pressure drops due to high demand",
      },
      {
        sensorType: "TRAFFIC",
        modifier: (v) => v * 0.8,
        description: "Traffic reduces as people avoid travel",
      },
    ],
    triggeredIncidents: [
      {
        type: "HEAT_ADVISORY",
        category: "ENVIRONMENTAL_HAZARD",
        description: "Extreme heat advisory - public health risk",
        delay: 30000, // 30 seconds
        severity: "HIGH",
      },
      {
        type: "WATER_SHORTAGE",
        category: "WATER_ANOMALY",
        description: "Water pressure low due to high demand",
        delay: 120000, // 2 minutes
        severity: "MEDIUM",
      },
    ],
    metadata: {
      icon: "☀️",
      color: "#F97316",
    },
  },
  {
    id: "power-outage",
    name: "Power Outage",
    description:
      "Widespread power outage affecting multiple zones. Street lighting, traffic signals, and infrastructure systems impacted.",
    duration: 300000, // 5 minutes
    sensorModifiers: [
      {
        sensorType: "LIGHT",
        modifier: (v) => v * 0.1,
        description: "Street lighting fails",
      },
      {
        sensorType: "TRAFFIC",
        modifier: (v) => v * 1.5,
        description: "Traffic increases due to signal failures",
      },
      {
        sensorType: "NOISE",
        modifier: (v) => v - 10,
        description: "Ambient noise reduces without power",
      },
    ],
    triggeredIncidents: [
      {
        type: "POWER_OUTAGE",
        category: "LIGHTING_FAILURE",
        description: "Widespread power outage - multiple zones affected",
        delay: 10000, // 10 seconds
        severity: "CRITICAL",
      },
      {
        type: "TRAFFIC_SIGNAL_OUT",
        category: "TRAFFIC_CONGESTION",
        description: "Traffic signals offline due to power outage",
        delay: 20000, // 20 seconds
        severity: "HIGH",
      },
      {
        type: "STREET_LIGHTING_FAILURE",
        category: "LIGHTING_FAILURE",
        description: "Street lighting system failure",
        delay: 15000, // 15 seconds
        severity: "HIGH",
      },
    ],
    metadata: {
      icon: "⚡",
      color: "#8B5CF6",
    },
  },
];

/**
 * Validate scenario configuration
 */
export function validateScenarioConfig(config: ScenarioConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.id || config.id.trim() === "") {
    errors.push("Scenario ID is required");
  }

  if (!config.name || config.name.trim() === "") {
    errors.push("Scenario name is required");
  }

  if (!config.description || config.description.trim() === "") {
    errors.push("Scenario description is required");
  }

  if (config.duration <= 0) {
    errors.push("Scenario duration must be positive");
  }

  if (!Array.isArray(config.sensorModifiers)) {
    errors.push("Sensor modifiers must be an array");
  }

  if (!Array.isArray(config.triggeredIncidents)) {
    errors.push("Triggered incidents must be an array");
  }

  // Validate sensor modifiers
  config.sensorModifiers.forEach((modifier, index) => {
    if (!modifier.sensorType && !modifier.sensorId && !modifier.zoneId) {
      errors.push(
        `Sensor modifier ${index} must specify sensorType, sensorId, or zoneId`
      );
    }

    if (typeof modifier.modifier !== "function") {
      errors.push(`Sensor modifier ${index} must have a modifier function`);
    }

    if (!modifier.description) {
      errors.push(`Sensor modifier ${index} must have a description`);
    }
  });

  // Validate triggered incidents
  config.triggeredIncidents.forEach((incident, index) => {
    if (!incident.type) {
      errors.push(`Triggered incident ${index} must have a type`);
    }

    if (!incident.category) {
      errors.push(`Triggered incident ${index} must have a category`);
    }

    if (!incident.description) {
      errors.push(`Triggered incident ${index} must have a description`);
    }

    if (incident.delay < 0) {
      errors.push(`Triggered incident ${index} delay must be non-negative`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
