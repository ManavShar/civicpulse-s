import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface SensorConfig {
  baseValue: number;
  unit: string;
  interval: number;
  anomalyProbability: number;
  thresholds: {
    warning: number;
    critical: number;
  };
}

interface SensorData {
  name: string;
  type: "WASTE" | "LIGHT" | "WATER" | "TRAFFIC" | "ENVIRONMENT" | "NOISE";
  location: [number, number];
  zoneIndex: number;
  config: SensorConfig;
  metadata: {
    description: string;
    installDate: string;
    manufacturer: string;
    model: string;
  };
}

// Sensor type configurations with realistic parameters
const sensorTypeConfigs: Record<string, Partial<SensorConfig>> = {
  WASTE: {
    unit: "%",
    interval: 10000,
    anomalyProbability: 0.05,
    thresholds: { warning: 75, critical: 90 },
  },
  LIGHT: {
    unit: "lux",
    interval: 15000,
    anomalyProbability: 0.03,
    thresholds: { warning: 50, critical: 20 },
  },
  WATER: {
    unit: "psi",
    interval: 5000,
    anomalyProbability: 0.04,
    thresholds: { warning: 40, critical: 30 },
  },
  TRAFFIC: {
    unit: "vehicles/min",
    interval: 8000,
    anomalyProbability: 0.06,
    thresholds: { warning: 200, critical: 300 },
  },
  ENVIRONMENT: {
    unit: "AQI",
    interval: 20000,
    anomalyProbability: 0.05,
    thresholds: { warning: 100, critical: 150 },
  },
  NOISE: {
    unit: "dB",
    interval: 12000,
    anomalyProbability: 0.04,
    thresholds: { warning: 70, critical: 85 },
  },
};

// Generate sensor distribution across zones
function generateSensors(): SensorData[] {
  const sensors: SensorData[] = [];
  let sensorId = 1;

  // Zone configurations: [name, type, baseCoords, population]
  const zoneConfigs = [
    {
      name: "Downtown Financial District",
      type: "COMMERCIAL",
      baseCoords: [-122.41, 37.79],
      population: 15000,
      index: 0,
    },
    {
      name: "Riverside Residential",
      type: "RESIDENTIAL",
      baseCoords: [-122.39, 37.79],
      population: 25000,
      index: 1,
    },
    {
      name: "Industrial Park",
      type: "INDUSTRIAL",
      baseCoords: [-122.41, 37.77],
      population: 5000,
      index: 2,
    },
    {
      name: "Central Park",
      type: "PARK",
      baseCoords: [-122.39, 37.77],
      population: 0,
      index: 3,
    },
    {
      name: "Tech District",
      type: "COMMERCIAL",
      baseCoords: [-122.37, 37.79],
      population: 12000,
      index: 4,
    },
    {
      name: "Suburban Heights",
      type: "RESIDENTIAL",
      baseCoords: [-122.37, 37.77],
      population: 30000,
      index: 5,
    },
    {
      name: "Harbor District",
      type: "COMMERCIAL",
      baseCoords: [-122.41, 37.75],
      population: 8000,
      index: 6,
    },
    {
      name: "University Quarter",
      type: "RESIDENTIAL",
      baseCoords: [-122.39, 37.75],
      population: 18000,
      index: 7,
    },
    {
      name: "Green Valley Park",
      type: "PARK",
      baseCoords: [-122.37, 37.75],
      population: 0,
      index: 8,
    },
    {
      name: "Innovation Campus",
      type: "INDUSTRIAL",
      baseCoords: [-122.35, 37.77],
      population: 7000,
      index: 9,
    },
  ];

  // Sensor density based on zone type
  const getSensorCount = (zoneType: string): Record<string, number> => {
    const baseCounts = {
      COMMERCIAL: {
        WASTE: 3,
        LIGHT: 3,
        WATER: 2,
        TRAFFIC: 3,
        ENVIRONMENT: 2,
        NOISE: 2,
      },
      RESIDENTIAL: {
        WASTE: 3,
        LIGHT: 3,
        WATER: 2,
        TRAFFIC: 2,
        ENVIRONMENT: 1,
        NOISE: 2,
      },
      INDUSTRIAL: {
        WASTE: 3,
        LIGHT: 2,
        WATER: 2,
        TRAFFIC: 2,
        ENVIRONMENT: 3,
        NOISE: 2,
      },
      PARK: {
        WASTE: 2,
        LIGHT: 2,
        WATER: 1,
        TRAFFIC: 0,
        ENVIRONMENT: 2,
        NOISE: 1,
      },
    };
    return (
      baseCounts[zoneType as keyof typeof baseCounts] || baseCounts.RESIDENTIAL
    );
  };

  // Generate sensors for each zone
  for (const zone of zoneConfigs) {
    const sensorCounts = getSensorCount(zone.type);
    const [baseLon, baseLat] = zone.baseCoords;

    // Generate sensors of each type
    for (const [sensorType, count] of Object.entries(sensorCounts)) {
      for (let i = 0; i < count; i++) {
        // Distribute sensors geographically within zone
        const offsetLon = (Math.random() - 0.5) * 0.015;
        const offsetLat = (Math.random() - 0.5) * 0.015;
        const location: [number, number] = [
          baseLon + offsetLon,
          baseLat + offsetLat,
        ];

        // Get base config for sensor type
        const typeConfig = sensorTypeConfigs[sensorType];

        // Determine base value based on zone type and sensor type
        const baseValue = getBaseValue(sensorType, zone.type);

        const sensor: SensorData = {
          name: `${zone.name} ${
            sensorType.charAt(0) + sensorType.slice(1).toLowerCase()
          } ${i + 1}`,
          type: sensorType as SensorData["type"],
          location,
          zoneIndex: zone.index,
          config: {
            baseValue,
            unit: typeConfig.unit!,
            interval: typeConfig.interval!,
            anomalyProbability: typeConfig.anomalyProbability!,
            thresholds: typeConfig.thresholds!,
          },
          metadata: {
            description: `${sensorType} sensor monitoring ${zone.name}`,
            installDate: getRandomInstallDate(),
            manufacturer: getRandomManufacturer(sensorType),
            model: getRandomModel(sensorType),
          },
        };

        sensors.push(sensor);
        sensorId++;
      }
    }
  }

  return sensors;
}

// Helper function to determine base value based on zone and sensor type
function getBaseValue(sensorType: string, zoneType: string): number {
  const baseValues: Record<string, Record<string, number>> = {
    WASTE: { COMMERCIAL: 55, RESIDENTIAL: 40, INDUSTRIAL: 65, PARK: 30 },
    LIGHT: { COMMERCIAL: 100, RESIDENTIAL: 100, INDUSTRIAL: 100, PARK: 100 },
    WATER: { COMMERCIAL: 60, RESIDENTIAL: 55, INDUSTRIAL: 70, PARK: 50 },
    TRAFFIC: { COMMERCIAL: 150, RESIDENTIAL: 80, INDUSTRIAL: 100, PARK: 20 },
    ENVIRONMENT: { COMMERCIAL: 75, RESIDENTIAL: 50, INDUSTRIAL: 90, PARK: 30 },
    NOISE: { COMMERCIAL: 65, RESIDENTIAL: 55, INDUSTRIAL: 75, PARK: 45 },
  };

  return baseValues[sensorType]?.[zoneType] || 50;
}

// Helper function to generate random install date (within last 2 years)
function getRandomInstallDate(): string {
  const now = new Date();
  const twoYearsAgo = new Date(
    now.getFullYear() - 2,
    now.getMonth(),
    now.getDate()
  );
  const randomTime =
    twoYearsAgo.getTime() +
    Math.random() * (now.getTime() - twoYearsAgo.getTime());
  return new Date(randomTime).toISOString().split("T")[0];
}

// Helper function to get random manufacturer
function getRandomManufacturer(sensorType: string): string {
  const manufacturers: Record<string, string[]> = {
    WASTE: ["SmartBin Inc", "EcoSense", "WasteWatch"],
    LIGHT: ["LuminaTech", "BrightSense", "UrbanLight"],
    WATER: ["AquaMonitor", "FlowSense", "HydroTech"],
    TRAFFIC: ["TrafficVision", "FlowMetrics", "UrbanMobility"],
    ENVIRONMENT: ["AirQuality Pro", "EnviroSense", "CleanAir Systems"],
    NOISE: ["SoundMonitor", "NoiseGuard", "AcousticSense"],
  };

  const options = manufacturers[sensorType] || ["Generic Sensors Inc"];
  return options[Math.floor(Math.random() * options.length)];
}

// Helper function to get random model
function getRandomModel(sensorType: string): string {
  const prefix = sensorType.substring(0, 2).toUpperCase();
  const modelNumber = Math.floor(Math.random() * 9000) + 1000;
  const version = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
  return `${prefix}-${modelNumber}${version}`;
}

export async function seedSensors(zoneIds: string[]): Promise<string[]> {
  const client = await pool.connect();
  const sensorIds: string[] = [];

  try {
    console.log("Generating sensor data...");
    const sensors = generateSensors();
    console.log(
      `Generated ${sensors.length} sensors across ${zoneIds.length} zones`
    );

    console.log("\nSeeding sensors...");
    for (const sensor of sensors) {
      const zoneId = zoneIds[sensor.zoneIndex];
      const locationWKT = `POINT(${sensor.location[0]} ${sensor.location[1]})`;

      const result = await client.query(
        `INSERT INTO sensors (name, type, location, zone_id, config, status, metadata)
         VALUES ($1, $2, ST_GeogFromText($3), $4, $5, $6, $7)
         RETURNING id`,
        [
          sensor.name,
          sensor.type,
          locationWKT,
          zoneId,
          JSON.stringify(sensor.config),
          "online",
          JSON.stringify(sensor.metadata),
        ]
      );

      sensorIds.push(result.rows[0].id);
    }

    // Print summary by type
    const typeCounts = sensors.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n✅ Successfully seeded ${sensors.length} sensors`);
    console.log("\nSensors by type:");
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    return sensorIds;
  } catch (error) {
    console.error("Error seeding sensors:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    // First, get zone IDs from database
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id FROM zones ORDER BY created_at"
      );
      const zoneIds = result.rows.map((row) => row.id);

      if (zoneIds.length === 0) {
        console.error("No zones found. Please run seed-zones.ts first.");
        process.exit(1);
      }

      await seedSensors(zoneIds);
      console.log("\nSensor seeding completed!");
      process.exit(0);
    } catch (error) {
      console.error("Sensor seeding failed:", error);
      process.exit(1);
    } finally {
      client.release();
      await pool.end();
    }
  })();
}
