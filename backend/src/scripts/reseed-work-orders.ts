import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Generate work orders for existing incidents
async function reseedWorkOrders(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\n=== Reseeding Work Orders ===");

    // Step 1: Clear existing work orders
    console.log("\nClearing existing work orders...");
    await client.query("TRUNCATE work_orders CASCADE");
    console.log("✓ Work orders cleared");

    // Step 2: Get all incidents
    const incidents = await client.query(
      `SELECT i.*, z.name as zone_name
       FROM incidents i
       JOIN zones z ON i.zone_id = z.id
       ORDER BY i.detected_at DESC`
    );

    console.log(`\nFound ${incidents.rows.length} incidents`);

    if (incidents.rows.length === 0) {
      console.log("⚠️  No incidents found. Please seed incidents first.");
      return;
    }

    // Step 3: Generate work orders
    let workOrderCount = 0;
    const statusDistribution = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      ASSIGNED: 0,
      CREATED: 0,
    };

    for (const incident of incidents.rows) {
      // 85% of incidents have work orders
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
          JSON.stringify({ reseeded: true }),
        ]
      );

      workOrderCount++;
    }

    console.log(`\n✅ Generated ${workOrderCount} work orders`);
    console.log(`\nStatus breakdown:`);
    console.log(`  - CREATED: ${statusDistribution.CREATED}`);
    console.log(`  - ASSIGNED: ${statusDistribution.ASSIGNED}`);
    console.log(`  - IN_PROGRESS: ${statusDistribution.IN_PROGRESS}`);
    console.log(`  - COMPLETED: ${statusDistribution.COMPLETED}`);
    console.log(`\n✅ Work orders reseeded successfully!`);
  } catch (error) {
    console.error("Error reseeding work orders:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  reseedWorkOrders()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nFatal error:", error);
      process.exit(1);
    });
}

export { reseedWorkOrders };
