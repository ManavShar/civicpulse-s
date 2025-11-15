import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Sensor {
  id: string;
  name: string;
  type: string;
  location: { coordinates: [number, number] };
  zone_id: string;
  config: {
    baseValue: number;
    unit: string;
    interval: number;
    anomalyProbability: number;
    thresholds: { warning: number; critical: number };
  };
}

interface Zone {
  id: string;
  name: string;
  type: string;
  population: number;
}

// Generate realistic sensor reading with daily/weekly patterns
function generateReading(
  sensor: Sensor,
  timestamp: Date,
  previousValue?: number
): { value: number; isAnomaly: boolean } {
  const { baseValue, anomalyProbability } = sensor.config;
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();

  // Time-of-day variation (different patterns for different sensor types)
  let timeMultiplier = 1.0;

  switch (sensor.type) {
    case "TRAFFIC":
      // Rush hour peaks (7-9 AM, 5-7 PM)
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        timeMultiplier = 1.5;
      } else if (hour >= 22 || hour <= 5) {
        timeMultiplier = 0.3;
      }
      break;

    case "WASTE":
      // Gradual fill throughout day, emptied at night
      if (hour >= 2 && hour <= 4) {
        timeMultiplier = 0.2; // Emptied
      } else {
        timeMultiplier = 0.5 + (hour / 24) * 0.8; // Gradual fill
      }
      break;

    case "LIGHT":
      // Inverse of daylight hours
      if (hour >= 6 && hour <= 18) {
        timeMultiplier = 0.3; // Daylight
      } else {
        timeMultiplier = 1.2; // Night
      }
      break;

    case "NOISE":
      // Higher during day, lower at night
      if (hour >= 22 || hour <= 6) {
        timeMultiplier = 0.6;
      } else if (hour >= 12 && hour <= 14) {
        timeMultiplier = 1.3; // Lunch hour
      }
      break;

    case "ENVIRONMENT":
      // Air quality worse during rush hours
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        timeMultiplier = 1.3;
      } else if (hour >= 2 && hour <= 5) {
        timeMultiplier = 0.7;
      }
      break;
  }

  // Day-of-week variation (weekends different from weekdays)
  let dayMultiplier = 1.0;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    if (sensor.type === "TRAFFIC") {
      dayMultiplier = 0.7;
    } else if (sensor.type === "WASTE" && sensor.name.includes("Park")) {
      dayMultiplier = 1.3; // More park usage on weekends
    }
  }

  // Calculate base value with patterns
  let value = baseValue * timeMultiplier * dayMultiplier;

  // Add Gaussian noise
  const noise = (Math.random() - 0.5) * (baseValue * 0.15);
  value += noise;

  // Smooth transition from previous value
  if (previousValue !== undefined) {
    value = previousValue * 0.7 + value * 0.3;
  }

  // Inject anomalies
  const isAnomaly = Math.random() < anomalyProbability;
  if (isAnomaly) {
    const anomalyMultiplier = Math.random() > 0.5 ? 1.5 : 0.5;
    value *= anomalyMultiplier;
  }

  // Ensure value is within reasonable bounds
  value = Math.max(0, value);
  if (sensor.type === "WASTE" || sensor.type === "LIGHT") {
    value = Math.min(100, value);
  }

  return { value: Math.round(value * 100) / 100, isAnomaly };
}

// Generate historical sensor readings
async function generateHistoricalReadings(
  sensors: Sensor[],
  days: number = 7
): Promise<void> {
  const client = await pool.connect();

  try {
    console.log(`\nGenerating ${days} days of historical sensor readings...`);
    console.log(`⚠️  Using reduced data mode for cloud storage optimization`);

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let totalReadings = 0;
    const batchSize = 1000;
    let batch: any[] = [];

    // OPTIMIZED DATA MODE: Target ~100K total readings for demo
    // With 50 sensors over 7 days, we need ~2000 readings per sensor
    // This means readings every ~5 minutes (288 per day)
    const DEMO_INTERVAL_MS = 5 * 60 * 1000; // 5 minute intervals
    const readingsPerDay = 288; // 288 readings per day (every 5 minutes)
    const maxReadingsPerSensor = readingsPerDay * days; // e.g., 2016 for 7 days

    console.log(
      `  Generating ~${maxReadingsPerSensor} readings per sensor (5-minute intervals)`
    );
    console.log(
      `  Total expected: ~${
        sensors.length * maxReadingsPerSensor
      } readings (~${Math.round(
        (sensors.length * maxReadingsPerSensor) / 1000
      )}K)`
    );

    for (const sensor of sensors) {
      let previousValue: number | undefined;

      for (let i = 0; i < maxReadingsPerSensor; i++) {
        const timestamp = new Date(startDate.getTime() + i * DEMO_INTERVAL_MS);
        const { value, isAnomaly } = generateReading(
          sensor,
          timestamp,
          previousValue
        );
        previousValue = value;

        batch.push({
          sensor_id: sensor.id,
          timestamp,
          value,
          unit: sensor.config.unit,
          metadata: { isAnomaly },
        });

        if (batch.length >= batchSize) {
          await insertReadingsBatch(client, batch);
          totalReadings += batch.length;
          batch = [];

          if (totalReadings % 5000 === 0) {
            console.log(`  Inserted ${totalReadings} readings...`);
          }
        }
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      await insertReadingsBatch(client, batch);
      totalReadings += batch.length;
    }

    console.log(
      `✅ Generated ${totalReadings.toLocaleString()} historical sensor readings`
    );
    console.log(
      `   (Optimized for demo: ~${Math.round(
        totalReadings / 1000
      )}K readings with 5-minute intervals)`
    );
  } finally {
    client.release();
  }
}

// Batch insert sensor readings
async function insertReadingsBatch(
  client: any,
  readings: any[]
): Promise<void> {
  const values = readings
    .map(
      (_r, i) =>
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${
          i * 5 + 5
        })`
    )
    .join(",");

  const params = readings.flatMap((r) => [
    r.sensor_id,
    r.timestamp,
    r.value,
    r.unit,
    JSON.stringify(r.metadata),
  ]);

  await client.query(
    `INSERT INTO sensor_readings (sensor_id, timestamp, value, unit, metadata)
     VALUES ${values}`,
    params
  );
}

// Generate historical incidents
async function generateHistoricalIncidents(
  sensors: Sensor[],
  zones: Zone[],
  days: number = 7
): Promise<string[]> {
  const client = await pool.connect();
  const incidentIds: string[] = [];

  try {
    console.log("\nGenerating historical incidents...");

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Generate 3-5 incidents per day
    const incidentsPerDay = 4;
    const totalIncidents = days * incidentsPerDay;

    const incidentTypes = [
      {
        type: "WASTE_OVERFLOW",
        category: "WASTE_OVERFLOW",
        sensorType: "WASTE",
      },
      {
        type: "LIGHTING_FAILURE",
        category: "LIGHTING_FAILURE",
        sensorType: "LIGHT",
      },
      { type: "WATER_LEAK", category: "WATER_ANOMALY", sensorType: "WATER" },
      {
        type: "TRAFFIC_JAM",
        category: "TRAFFIC_CONGESTION",
        sensorType: "TRAFFIC",
      },
      {
        type: "AIR_QUALITY_ALERT",
        category: "ENVIRONMENTAL_HAZARD",
        sensorType: "ENVIRONMENT",
      },
      {
        type: "NOISE_COMPLAINT",
        category: "NOISE_COMPLAINT",
        sensorType: "NOISE",
      },
    ];

    const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const severityWeights = [0.4, 0.35, 0.2, 0.05]; // Most incidents are low/medium

    for (let i = 0; i < totalIncidents; i++) {
      // Random timestamp within the period
      const randomOffset = Math.random() * days * 24 * 60 * 60 * 1000;
      const detectedAt = new Date(startDate.getTime() + randomOffset);

      // Select random incident type
      const incidentType =
        incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

      // Find sensors of matching type
      const matchingSensors = sensors.filter(
        (s) => s.type === incidentType.sensorType
      );
      if (matchingSensors.length === 0) continue;

      const sensor =
        matchingSensors[Math.floor(Math.random() * matchingSensors.length)];
      const zone = zones.find((z) => z.id === sensor.zone_id)!;

      // Select severity based on weights
      const severityRandom = Math.random();
      let cumulativeWeight = 0;
      let severity = "MEDIUM";
      for (let j = 0; j < severities.length; j++) {
        cumulativeWeight += severityWeights[j];
        if (severityRandom <= cumulativeWeight) {
          severity = severities[j];
          break;
        }
      }

      // Calculate priority score
      const priorityScore = calculatePriorityScore(severity, zone.population);

      // Determine if resolved (80% of historical incidents are resolved)
      const isResolved = Math.random() < 0.8;
      const resolvedAt = isResolved
        ? new Date(detectedAt.getTime() + Math.random() * 4 * 60 * 60 * 1000) // Resolved within 4 hours
        : null;
      const status = isResolved ? "RESOLVED" : "ACTIVE";

      const result = await client.query(
        `INSERT INTO incidents (
          type, category, severity, status, priority_score, confidence,
          location, zone_id, sensor_id, description, detected_at, resolved_at,
          metadata, scoring_breakdown
        )
        VALUES ($1, $2, $3, $4, $5, $6, ST_GeogFromText($7), $8, $9, $10, $11, $12, $13, $14)
        RETURNING id`,
        [
          incidentType.type,
          incidentType.category,
          severity,
          status,
          priorityScore,
          0.75 + Math.random() * 0.2, // Confidence 0.75-0.95
          `POINT(${sensor.location.coordinates[0]} ${sensor.location.coordinates[1]})`,
          zone.id,
          sensor.id,
          `${incidentType.type.replace(/_/g, " ")} detected at ${sensor.name}`,
          detectedAt,
          resolvedAt,
          JSON.stringify({ historical: true }),
          JSON.stringify({
            severity: priorityScore * 0.3,
            urgency: priorityScore * 0.25,
            publicImpact: priorityScore * 0.2,
            environmentalCost: priorityScore * 0.15,
            safetyRisk: priorityScore * 0.1,
          }),
        ]
      );

      incidentIds.push(result.rows[0].id);
    }

    console.log(`✅ Generated ${incidentIds.length} historical incidents`);

    // Print summary by severity
    const severityCounts = await client.query(
      `SELECT severity, COUNT(*) as count
       FROM incidents
       WHERE detected_at >= $1
       GROUP BY severity
       ORDER BY severity`,
      [startDate]
    );

    console.log("\nIncidents by severity:");
    severityCounts.rows.forEach((row) => {
      console.log(`  ${row.severity}: ${row.count}`);
    });

    return incidentIds;
  } finally {
    client.release();
  }
}

// Calculate priority score
function calculatePriorityScore(severity: string, population: number): number {
  const severityScores = { LOW: 20, MEDIUM: 40, HIGH: 70, CRITICAL: 95 };
  const baseScore =
    severityScores[severity as keyof typeof severityScores] || 40;

  // Adjust for population impact
  const populationFactor = Math.min(1.2, 1 + population / 100000);

  return Math.min(100, Math.round(baseScore * populationFactor));
}

// Generate historical work orders
async function generateHistoricalWorkOrders(
  incidentIds: string[]
): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\nGenerating historical work orders...");

    // Get ALL incidents (not just resolved) for better demo variety
    const incidents = await client.query(
      `SELECT i.*, z.name as zone_name
       FROM incidents i
       JOIN zones z ON i.zone_id = z.id
       WHERE i.id = ANY($1)`,
      [incidentIds]
    );

    let workOrderCount = 0;
    const statusDistribution = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      ASSIGNED: 0,
      CREATED: 0,
    };

    for (const incident of incidents.rows) {
      // 85% of incidents have work orders (increased from 90% for better demo)
      if (Math.random() > 0.85) continue;

      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      const priority =
        priorities[Math.floor(incident.priority_score / 25)] || "MEDIUM";

      // Work order created shortly after incident
      const createdAt = new Date(
        incident.detected_at.getTime() + Math.random() * 30 * 60 * 1000
      );

      // Determine status based on incident status and time
      let status: string;
      let assignedAt: Date | null = null;
      let startedAt: Date | null = null;
      let completedAt: Date | null = null;
      let estimatedCompletion: Date;

      const now = new Date();
      const isRecent =
        now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours

      if (incident.status === "RESOLVED") {
        // Resolved incidents have completed work orders
        status = "COMPLETED";
        assignedAt = new Date(
          createdAt.getTime() + Math.random() * 15 * 60 * 1000
        );
        startedAt = new Date(
          assignedAt.getTime() + Math.random() * 30 * 60 * 1000
        );
        const duration = 15 + Math.random() * 105;
        completedAt = new Date(startedAt.getTime() + duration * 60 * 1000);
        estimatedCompletion = completedAt;
        statusDistribution.COMPLETED++;
      } else if (isRecent) {
        // Recent active incidents have various statuses for demo
        const rand = Math.random();
        if (rand < 0.4) {
          // 40% IN_PROGRESS
          status = "IN_PROGRESS";
          assignedAt = new Date(
            createdAt.getTime() + Math.random() * 15 * 60 * 1000
          );
          startedAt = new Date(
            assignedAt.getTime() + Math.random() * 30 * 60 * 1000
          );
          estimatedCompletion = new Date(
            startedAt.getTime() + (30 + Math.random() * 90) * 60 * 1000
          );
          statusDistribution.IN_PROGRESS++;
        } else if (rand < 0.7) {
          // 30% ASSIGNED
          status = "ASSIGNED";
          assignedAt = new Date(
            createdAt.getTime() + Math.random() * 15 * 60 * 1000
          );
          estimatedCompletion = new Date(
            assignedAt.getTime() + (45 + Math.random() * 90) * 60 * 1000
          );
          statusDistribution.ASSIGNED++;
        } else {
          // 30% CREATED
          status = "CREATED";
          estimatedCompletion = new Date(
            createdAt.getTime() + (60 + Math.random() * 120) * 60 * 1000
          );
          statusDistribution.CREATED++;
        }
      } else {
        // Older active incidents are mostly completed
        status = "COMPLETED";
        assignedAt = new Date(
          createdAt.getTime() + Math.random() * 15 * 60 * 1000
        );
        startedAt = new Date(
          assignedAt.getTime() + Math.random() * 30 * 60 * 1000
        );
        const duration = 15 + Math.random() * 105;
        completedAt = new Date(startedAt.getTime() + duration * 60 * 1000);
        estimatedCompletion = completedAt;
        statusDistribution.COMPLETED++;
      }

      const duration =
        startedAt && completedAt
          ? Math.round((completedAt.getTime() - startedAt.getTime()) / 60000)
          : Math.round(30 + Math.random() * 90);

      await client.query(
        `INSERT INTO work_orders (
          incident_id, title, description, status, priority,
          assigned_unit_id, location, zone_id, estimated_duration,
          estimated_completion, started_at, completed_at, created_at, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          incident.id,
          `Resolve ${incident.type.replace(/_/g, " ")}`,
          `Work order for incident at ${incident.zone_name}`,
          status,
          priority,
          status !== "CREATED"
            ? `UNIT-${Math.floor(Math.random() * 20) + 1}`
            : null,
          incident.location,
          incident.zone_id,
          duration,
          estimatedCompletion,
          startedAt,
          completedAt,
          createdAt,
          JSON.stringify({ historical: true }),
        ]
      );

      workOrderCount++;
    }

    console.log(`✅ Generated ${workOrderCount} historical work orders`);
    console.log(`   Status breakdown:`);
    console.log(`   - CREATED: ${statusDistribution.CREATED}`);
    console.log(`   - ASSIGNED: ${statusDistribution.ASSIGNED}`);
    console.log(`   - IN_PROGRESS: ${statusDistribution.IN_PROGRESS}`);
    console.log(`   - COMPLETED: ${statusDistribution.COMPLETED}`);
  } finally {
    client.release();
  }
}

// Generate historical agent logs
async function generateHistoricalAgentLogs(
  incidentIds: string[]
): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\nGenerating historical agent logs...");

    // Get incidents with work orders
    const incidents = await client.query(
      `SELECT i.id as incident_id, i.detected_at, w.id as work_order_id, w.created_at
       FROM incidents i
       LEFT JOIN work_orders w ON i.id = w.incident_id
       WHERE i.id = ANY($1)
       AND i.status = 'RESOLVED'`,
      [incidentIds]
    );

    let logCount = 0;

    for (const incident of incidents.rows) {
      // Planner agent log
      const plannerTimestamp = new Date(incident.detected_at.getTime() + 5000);
      await client.query(
        `INSERT INTO agent_logs (agent_type, step, incident_id, data, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          "PLANNER",
          "PLANNING",
          incident.incident_id,
          JSON.stringify({
            situation_summary: "Incident detected and analyzed",
            risk_assessment: "Moderate risk to infrastructure",
            recommended_actions: [
              "Dispatch maintenance unit",
              "Monitor situation",
            ],
            historical: true,
          }),
          plannerTimestamp,
        ]
      );
      logCount++;

      if (incident.work_order_id) {
        // Dispatcher agent log
        const dispatcherTimestamp = new Date(
          incident.created_at.getTime() + 2000
        );
        await client.query(
          `INSERT INTO agent_logs (agent_type, step, incident_id, work_order_id, data, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            "DISPATCHER",
            "DISPATCHING",
            incident.incident_id,
            incident.work_order_id,
            JSON.stringify({
              assignments: ["Unit assigned to incident"],
              work_orders: [incident.work_order_id],
              historical: true,
            }),
            dispatcherTimestamp,
          ]
        );
        logCount++;

        // Analyst agent log
        const analystTimestamp = new Date(dispatcherTimestamp.getTime() + 3000);
        await client.query(
          `INSERT INTO agent_logs (agent_type, step, incident_id, work_order_id, data, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            "ANALYST",
            "EXPLAINING",
            incident.incident_id,
            incident.work_order_id,
            JSON.stringify({
              explanation:
                "Work order created based on incident priority and resource availability",
              key_factors: [
                "Incident severity",
                "Zone population",
                "Unit proximity",
              ],
              recommendations: ["Monitor completion", "Follow up if needed"],
              confidence: 0.85,
              historical: true,
            }),
            analystTimestamp,
          ]
        );
        logCount++;
      }
    }

    console.log(`✅ Generated ${logCount} historical agent logs`);
  } finally {
    client.release();
  }
}

// Main seeding function
export async function seedHistoricalData(days: number = 7): Promise<void> {
  const client = await pool.connect();

  try {
    console.log(`\n=== Generating ${days} days of historical data ===`);
    console.log(
      `📊 Cloud-optimized mode: Reduced data volume for 512MB storage limit`
    );

    // Get sensors
    const sensorsResult = await client.query(
      `SELECT s.id, s.name, s.type, s.zone_id, s.config,
              ST_X(s.location::geometry) as lon,
              ST_Y(s.location::geometry) as lat
       FROM sensors s`
    );

    const sensors: Sensor[] = sensorsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      location: { coordinates: [row.lon, row.lat] },
      zone_id: row.zone_id,
      config: row.config,
    }));

    // Get zones
    const zonesResult = await client.query(
      "SELECT id, name, type, population FROM zones"
    );
    const zones: Zone[] = zonesResult.rows;

    if (sensors.length === 0) {
      console.error("No sensors found. Please run seed-sensors.ts first.");
      return;
    }

    console.log(`\nFound ${sensors.length} sensors and ${zones.length} zones`);

    // Generate historical data
    await generateHistoricalReadings(sensors, days);
    const incidentIds = await generateHistoricalIncidents(sensors, zones, days);
    await generateHistoricalWorkOrders(incidentIds);
    await generateHistoricalAgentLogs(incidentIds);

    console.log("\n✅ Historical data generation completed successfully!");
    console.log(
      `💾 Storage-optimized: ~${Math.round(
        (sensors.length * 288 * days) / 1000
      )}K readings (5-min intervals) for demo`
    );
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  const days = parseInt(process.argv[2]) || 7;

  seedHistoricalData(days)
    .then(() => {
      console.log("\nHistorical data seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Historical data seeding failed:", error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}
