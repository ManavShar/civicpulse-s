import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Zone {
  name: string;
  type: string;
  boundary: number[][][];
  population: number;
}

interface Sensor {
  name: string;
  type: string;
  location: [number, number];
  zoneIndex: number;
  config: {
    baseValue: number;
    unit: string;
    interval: number;
    anomalyProbability: number;
  };
}

// Demo zones for a fictional city
const zones: Zone[] = [
  {
    name: "Downtown",
    type: "COMMERCIAL",
    boundary: [
      [
        [-122.42, 37.78],
        [-122.4, 37.78],
        [-122.4, 37.8],
        [-122.42, 37.8],
        [-122.42, 37.78],
      ],
    ],
    population: 15000,
  },
  {
    name: "Riverside",
    type: "RESIDENTIAL",
    boundary: [
      [
        [-122.4, 37.78],
        [-122.38, 37.78],
        [-122.38, 37.8],
        [-122.4, 37.8],
        [-122.4, 37.78],
      ],
    ],
    population: 25000,
  },
  {
    name: "Industrial Park",
    type: "INDUSTRIAL",
    boundary: [
      [
        [-122.42, 37.76],
        [-122.4, 37.76],
        [-122.4, 37.78],
        [-122.42, 37.78],
        [-122.42, 37.76],
      ],
    ],
    population: 5000,
  },
  {
    name: "Central Park",
    type: "PARK",
    boundary: [
      [
        [-122.4, 37.76],
        [-122.38, 37.76],
        [-122.38, 37.78],
        [-122.4, 37.78],
        [-122.4, 37.76],
      ],
    ],
    population: 0,
  },
  {
    name: "Tech District",
    type: "COMMERCIAL",
    boundary: [
      [
        [-122.38, 37.78],
        [-122.36, 37.78],
        [-122.36, 37.8],
        [-122.38, 37.8],
        [-122.38, 37.78],
      ],
    ],
    population: 12000,
  },
  {
    name: "Suburban Heights",
    type: "RESIDENTIAL",
    boundary: [
      [
        [-122.38, 37.76],
        [-122.36, 37.76],
        [-122.36, 37.78],
        [-122.38, 37.78],
        [-122.38, 37.76],
      ],
    ],
    population: 30000,
  },
];

// Sensor configurations distributed across zones
const sensors: Sensor[] = [
  // Downtown sensors
  {
    name: "Downtown Waste Bin 1",
    type: "WASTE",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 50,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Downtown Waste Bin 2",
    type: "WASTE",
    location: [-122.415, 37.785],
    zoneIndex: 0,
    config: {
      baseValue: 45,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Downtown Street Light 1",
    type: "LIGHT",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Downtown Street Light 2",
    type: "LIGHT",
    location: [-122.405, 37.795],
    zoneIndex: 0,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Downtown Water Pressure",
    type: "WATER",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 60,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Downtown Traffic Flow 1",
    type: "TRAFFIC",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 150,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Downtown Traffic Flow 2",
    type: "TRAFFIC",
    location: [-122.405, 37.795],
    zoneIndex: 0,
    config: {
      baseValue: 180,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Downtown Air Quality",
    type: "ENVIRONMENT",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 75,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Downtown Noise Level",
    type: "NOISE",
    location: [-122.41, 37.79],
    zoneIndex: 0,
    config: {
      baseValue: 65,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.04,
    },
  },

  // Riverside sensors
  {
    name: "Riverside Waste Bin 1",
    type: "WASTE",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 40,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Riverside Waste Bin 2",
    type: "WASTE",
    location: [-122.395, 37.785],
    zoneIndex: 1,
    config: {
      baseValue: 35,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Riverside Street Light 1",
    type: "LIGHT",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Riverside Street Light 2",
    type: "LIGHT",
    location: [-122.385, 37.795],
    zoneIndex: 1,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Riverside Water Pressure",
    type: "WATER",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 55,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Riverside Traffic Flow",
    type: "TRAFFIC",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 80,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Riverside Air Quality",
    type: "ENVIRONMENT",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 50,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Riverside Noise Level",
    type: "NOISE",
    location: [-122.39, 37.79],
    zoneIndex: 1,
    config: {
      baseValue: 55,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.04,
    },
  },

  // Industrial Park sensors
  {
    name: "Industrial Waste Bin 1",
    type: "WASTE",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 60,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.07,
    },
  },
  {
    name: "Industrial Waste Bin 2",
    type: "WASTE",
    location: [-122.405, 37.775],
    zoneIndex: 2,
    config: {
      baseValue: 65,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.07,
    },
  },
  {
    name: "Industrial Street Light",
    type: "LIGHT",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Industrial Water Pressure",
    type: "WATER",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 70,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Industrial Traffic Flow",
    type: "TRAFFIC",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 100,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Industrial Air Quality",
    type: "ENVIRONMENT",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 90,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.08,
    },
  },
  {
    name: "Industrial Noise Level",
    type: "NOISE",
    location: [-122.41, 37.77],
    zoneIndex: 2,
    config: {
      baseValue: 75,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.06,
    },
  },

  // Central Park sensors
  {
    name: "Park Waste Bin 1",
    type: "WASTE",
    location: [-122.39, 37.77],
    zoneIndex: 3,
    config: {
      baseValue: 30,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Park Waste Bin 2",
    type: "WASTE",
    location: [-122.385, 37.775],
    zoneIndex: 3,
    config: {
      baseValue: 25,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Park Street Light 1",
    type: "LIGHT",
    location: [-122.39, 37.77],
    zoneIndex: 3,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.02,
    },
  },
  {
    name: "Park Street Light 2",
    type: "LIGHT",
    location: [-122.385, 37.775],
    zoneIndex: 3,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.02,
    },
  },
  {
    name: "Park Water Fountain",
    type: "WATER",
    location: [-122.39, 37.77],
    zoneIndex: 3,
    config: {
      baseValue: 50,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Park Air Quality",
    type: "ENVIRONMENT",
    location: [-122.39, 37.77],
    zoneIndex: 3,
    config: {
      baseValue: 30,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Park Noise Level",
    type: "NOISE",
    location: [-122.39, 37.77],
    zoneIndex: 3,
    config: {
      baseValue: 45,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.03,
    },
  },

  // Tech District sensors
  {
    name: "Tech District Waste Bin 1",
    type: "WASTE",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 55,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Tech District Waste Bin 2",
    type: "WASTE",
    location: [-122.375, 37.785],
    zoneIndex: 4,
    config: {
      baseValue: 50,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Tech District Street Light 1",
    type: "LIGHT",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Tech District Street Light 2",
    type: "LIGHT",
    location: [-122.365, 37.795],
    zoneIndex: 4,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Tech District Water Pressure",
    type: "WATER",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 58,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Tech District Traffic Flow 1",
    type: "TRAFFIC",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 120,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Tech District Traffic Flow 2",
    type: "TRAFFIC",
    location: [-122.365, 37.795],
    zoneIndex: 4,
    config: {
      baseValue: 140,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.06,
    },
  },
  {
    name: "Tech District Air Quality",
    type: "ENVIRONMENT",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 60,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Tech District Noise Level",
    type: "NOISE",
    location: [-122.37, 37.79],
    zoneIndex: 4,
    config: {
      baseValue: 60,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.04,
    },
  },

  // Suburban Heights sensors
  {
    name: "Suburban Waste Bin 1",
    type: "WASTE",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 35,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Suburban Waste Bin 2",
    type: "WASTE",
    location: [-122.375, 37.775],
    zoneIndex: 5,
    config: {
      baseValue: 30,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Suburban Waste Bin 3",
    type: "WASTE",
    location: [-122.365, 37.765],
    zoneIndex: 5,
    config: {
      baseValue: 32,
      unit: "%",
      interval: 10000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Suburban Street Light 1",
    type: "LIGHT",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Suburban Street Light 2",
    type: "LIGHT",
    location: [-122.365, 37.775],
    zoneIndex: 5,
    config: {
      baseValue: 100,
      unit: "lux",
      interval: 15000,
      anomalyProbability: 0.03,
    },
  },
  {
    name: "Suburban Water Pressure",
    type: "WATER",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 52,
      unit: "psi",
      interval: 5000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Suburban Traffic Flow",
    type: "TRAFFIC",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 60,
      unit: "vehicles/min",
      interval: 8000,
      anomalyProbability: 0.05,
    },
  },
  {
    name: "Suburban Air Quality",
    type: "ENVIRONMENT",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 40,
      unit: "AQI",
      interval: 20000,
      anomalyProbability: 0.04,
    },
  },
  {
    name: "Suburban Noise Level",
    type: "NOISE",
    location: [-122.37, 37.77],
    zoneIndex: 5,
    config: {
      baseValue: 50,
      unit: "dB",
      interval: 12000,
      anomalyProbability: 0.03,
    },
  },
];

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("Starting database seeding...");

    // Start transaction
    await client.query("BEGIN");

    // Clear existing data (in reverse order of dependencies)
    console.log("Clearing existing data...");
    await client.query(
      "TRUNCATE agent_logs, work_orders, predictions, incidents, sensor_readings, sensors, zones CASCADE"
    );

    // Insert zones
    console.log("Inserting zones...");
    const zoneIds: string[] = [];
    for (const zone of zones) {
      const boundaryWKT = `POLYGON((${zone.boundary[0]
        .map((coord) => `${coord[0]} ${coord[1]}`)
        .join(", ")}))`;
      const result = await client.query(
        `INSERT INTO zones (name, type, boundary, population, metadata)
         VALUES ($1, $2, ST_GeogFromText($3), $4, $5)
         RETURNING id`,
        [zone.name, zone.type, boundaryWKT, zone.population, JSON.stringify({})]
      );
      zoneIds.push(result.rows[0].id);
      console.log(`  ✓ Created zone: ${zone.name}`);
    }

    // Insert sensors
    console.log("Inserting sensors...");
    let sensorCount = 0;
    for (const sensor of sensors) {
      const zoneId = zoneIds[sensor.zoneIndex];
      const locationWKT = `POINT(${sensor.location[0]} ${sensor.location[1]})`;
      await client.query(
        `INSERT INTO sensors (name, type, location, zone_id, config, status, metadata)
         VALUES ($1, $2, ST_GeogFromText($3), $4, $5, $6, $7)`,
        [
          sensor.name,
          sensor.type,
          locationWKT,
          zoneId,
          JSON.stringify(sensor.config),
          "online",
          JSON.stringify({}),
        ]
      );
      sensorCount++;
    }
    console.log(`  ✓ Created ${sensorCount} sensors`);

    // Create demo user accounts
    console.log("Creating demo users...");
    const bcrypt = require("bcrypt");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const operatorPassword = await bcrypt.hash("operator123", 10);
    const viewerPassword = await bcrypt.hash("viewer123", 10);

    await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES 
         ($1, $2, $3, $4),
         ($5, $6, $7, $8),
         ($9, $10, $11, $12)`,
      [
        "admin",
        "admin@civicpulse.ai",
        adminPassword,
        "ADMIN",
        "operator",
        "operator@civicpulse.ai",
        operatorPassword,
        "OPERATOR",
        "viewer",
        "viewer@civicpulse.ai",
        viewerPassword,
        "VIEWER",
      ]
    );
    console.log("  ✓ Created demo users (admin, operator, viewer)");

    // Commit transaction
    await client.query("COMMIT");

    console.log("\n✅ Database seeding completed successfully!");
    console.log(`\nSummary:`);
    console.log(`  - Zones: ${zones.length}`);
    console.log(`  - Sensors: ${sensorCount}`);
    console.log(`  - Users: 3 (admin, operator, viewer)`);
    console.log(`\nDemo Credentials:`);
    console.log(`  Admin:    admin / admin123`);
    console.log(`  Operator: operator / operator123`);
    console.log(`  Viewer:   viewer / viewer123`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedDatabase().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
