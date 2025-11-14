import { Pool } from "pg";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetDatabase() {
  console.log("🔄 Resetting database...\n");

  try {
    // Drop all tables
    console.log("Dropping all tables...");
    const client = await pool.connect();

    await client.query(`
      DROP TABLE IF EXISTS agent_logs CASCADE;
      DROP TABLE IF EXISTS work_orders CASCADE;
      DROP TABLE IF EXISTS predictions CASCADE;
      DROP TABLE IF EXISTS incidents CASCADE;
      DROP TABLE IF EXISTS sensor_readings CASCADE;
      DROP TABLE IF EXISTS sensors CASCADE;
      DROP TABLE IF EXISTS zones CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS pgmigrations CASCADE;
    `);

    console.log("  ✓ All tables dropped");
    client.release();
    await pool.end();

    // Run migrations
    console.log("\nRunning migrations...");
    execSync("npm run migrate", { stdio: "inherit", cwd: process.cwd() });
    console.log("  ✓ Migrations completed");

    // Run seed script
    console.log("\nSeeding database...");
    execSync("npm run seed", { stdio: "inherit", cwd: process.cwd() });

    console.log("\n✅ Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
