import { Pool } from "pg";
import * as dotenv from "dotenv";
import { seedZones } from "./seed-zones";
import { seedSensors } from "./seed-sensors";
import { seedHistoricalData } from "./seed-historical-data";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Reset database by clearing all data
async function resetDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\n=== Resetting Database ===");
    console.log("Clearing all existing data...");

    await client.query("BEGIN");

    // Truncate tables in reverse order of dependencies
    const tables = [
      "agent_logs",
      "work_orders",
      "predictions",
      "incidents",
      "sensor_readings",
      "sensors",
      "zones",
      "users",
    ];

    for (const table of tables) {
      await client.query(`TRUNCATE ${table} CASCADE`);
      console.log(`  ✓ Cleared ${table}`);
    }

    await client.query("COMMIT");
    console.log("\n✅ Database reset completed");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error resetting database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Validate seeded data
async function validateSeedData(): Promise<boolean> {
  const client = await pool.connect();

  try {
    console.log("\n=== Validating Seed Data ===");

    const validations = [
      { table: "zones", minCount: 5, description: "zones" },
      { table: "sensors", minCount: 50, description: "sensors" },
      {
        table: "sensor_readings",
        minCount: 1000,
        description: "sensor readings",
      },
      { table: "incidents", minCount: 10, description: "incidents" },
      { table: "work_orders", minCount: 5, description: "work orders" },
      { table: "agent_logs", minCount: 10, description: "agent logs" },
      { table: "users", minCount: 3, description: "users" },
    ];

    let allValid = true;

    for (const validation of validations) {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${validation.table}`
      );
      const count = parseInt(result.rows[0].count);

      if (count >= validation.minCount) {
        console.log(`  ✓ ${validation.description}: ${count} records`);
      } else {
        console.log(
          `  ✗ ${validation.description}: ${count} records (expected at least ${validation.minCount})`
        );
        allValid = false;
      }
    }

    // Additional validations

    // Check that all sensors have a zone
    const sensorsWithoutZone = await client.query(
      "SELECT COUNT(*) as count FROM sensors WHERE zone_id IS NULL"
    );
    if (parseInt(sensorsWithoutZone.rows[0].count) === 0) {
      console.log("  ✓ All sensors are assigned to zones");
    } else {
      console.log("  ✗ Some sensors are not assigned to zones");
      allValid = false;
    }

    // Check that incidents have valid locations
    const incidentsWithoutLocation = await client.query(
      "SELECT COUNT(*) as count FROM incidents WHERE location IS NULL"
    );
    if (parseInt(incidentsWithoutLocation.rows[0].count) === 0) {
      console.log("  ✓ All incidents have valid locations");
    } else {
      console.log("  ✗ Some incidents are missing locations");
      allValid = false;
    }

    // Check sensor reading time range
    const readingTimeRange = await client.query(
      `SELECT 
        MIN(timestamp) as earliest,
        MAX(timestamp) as latest,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400 as days
       FROM sensor_readings`
    );

    if (readingTimeRange.rows.length > 0 && readingTimeRange.rows[0].days) {
      const days = Math.round(parseFloat(readingTimeRange.rows[0].days));
      console.log(`  ✓ Sensor readings span ${days} days`);
    }

    if (allValid) {
      console.log("\n✅ All validations passed");
    } else {
      console.log("\n⚠️  Some validations failed");
    }

    return allValid;
  } catch (error) {
    console.error("Error validating seed data:", error);
    return false;
  } finally {
    client.release();
  }
}

// Create demo users
async function createDemoUsers(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\nCreating demo users...");

    const bcrypt = require("bcrypt");
    const saltRounds = 10;

    const users = [
      {
        username: "admin",
        email: "admin@civicpulse.ai",
        password: "admin123",
        role: "ADMIN",
      },
      {
        username: "operator",
        email: "operator@civicpulse.ai",
        password: "operator123",
        role: "OPERATOR",
      },
      {
        username: "viewer",
        email: "viewer@civicpulse.ai",
        password: "viewer123",
        role: "VIEWER",
      },
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);

      await client.query(
        `INSERT INTO users (username, email, password_hash, role, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.username, user.email, passwordHash, user.role, JSON.stringify({})]
      );

      console.log(`  ✓ Created user: ${user.username} (${user.role})`);
    }

    console.log("\n✅ Demo users created");
    console.log("\nDemo Credentials:");
    console.log("  Admin:    admin / admin123");
    console.log("  Operator: operator / operator123");
    console.log("  Viewer:   viewer / viewer123");
  } catch (error) {
    console.error("Error creating demo users:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Main reseed function
async function reseedDatabase(options: {
  skipReset?: boolean;
  historicalDays?: number;
  skipValidation?: boolean;
}): Promise<void> {
  const {
    skipReset = false,
    historicalDays = 7,
    skipValidation = false,
  } = options;

  try {
    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║   CivicPulse AI - Database Seeding Script     ║");
    console.log("╚════════════════════════════════════════════════╝");

    const startTime = Date.now();

    // Step 1: Reset database (if not skipped)
    if (!skipReset) {
      await resetDatabase();
    } else {
      console.log("\n⚠️  Skipping database reset (data will be appended)");
    }

    // Step 2: Seed zones
    console.log("\n=== Step 1: Seeding Zones ===");
    const zoneIds = await seedZones();

    // Step 3: Seed sensors
    console.log("\n=== Step 2: Seeding Sensors ===");
    await seedSensors(zoneIds);

    // Step 4: Create demo users
    console.log("\n=== Step 3: Creating Demo Users ===");
    await createDemoUsers();

    // Step 5: Generate historical data
    console.log(
      `\n=== Step 4: Generating Historical Data (${historicalDays} days) ===`
    );
    await seedHistoricalData(historicalDays);

    // Step 6: Validate
    if (!skipValidation) {
      const isValid = await validateSeedData();
      if (!isValid) {
        console.warn(
          "\n⚠️  Validation found some issues, but seeding completed"
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║          Seeding Completed Successfully!      ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log(`\nTotal time: ${duration} seconds`);
    console.log("\nYour CivicPulse AI demo environment is ready!");
    console.log("\nNext steps:");
    console.log("  1. Start the backend server: npm run dev");
    console.log("  2. Start the frontend: cd frontend && npm run dev");
    console.log("  3. Login with demo credentials (see above)");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs(): {
  skipReset: boolean;
  historicalDays: number;
  skipValidation: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    skipReset: false,
    historicalDays: 7,
    skipValidation: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--skip-reset":
        options.skipReset = true;
        break;
      case "--days":
        options.historicalDays = parseInt(args[++i]) || 7;
        break;
      case "--skip-validation":
        options.skipValidation = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
}

// Show help
function showHelp(): void {
  console.log(`
CivicPulse AI - Database Reset and Seed Script

Usage: npm run seed [options]

Options:
  --skip-reset         Skip database reset (append data instead of replacing)
  --days <number>      Number of days of historical data to generate (default: 7)
  --skip-validation    Skip data validation after seeding
  --help, -h           Show this help message

Examples:
  npm run seed                    # Full reset and seed with 7 days of data
  npm run seed -- --days 14       # Reset and seed with 14 days of data
  npm run seed -- --skip-reset    # Append data without resetting

Environment Variables:
  DATABASE_URL         PostgreSQL connection string (required)

Demo Credentials (created during seeding):
  Admin:    admin / admin123
  Operator: operator / operator123
  Viewer:   viewer / viewer123
`);
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  reseedDatabase(options)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nFatal error:", error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

export { resetDatabase, reseedDatabase, validateSeedData };
