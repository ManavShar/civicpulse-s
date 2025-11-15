import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearSensorReadings(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("\n=== Clearing Sensor Readings ===");

    // Get current count
    const beforeCount = await client.query(
      "SELECT COUNT(*) as count FROM sensor_readings"
    );
    console.log(
      `Current sensor readings: ${beforeCount.rows[0].count.toLocaleString()}`
    );

    // Clear the table
    console.log("\nClearing sensor_readings table...");
    await client.query("TRUNCATE sensor_readings CASCADE");

    // Verify
    const afterCount = await client.query(
      "SELECT COUNT(*) as count FROM sensor_readings"
    );
    console.log(`Remaining readings: ${afterCount.rows[0].count}`);

    console.log("\n✅ Sensor readings cleared successfully!");
    console.log(
      "\nTo regenerate with reduced data, run: npm run seed:historical -- 1"
    );
    console.log("(This will generate 1 day of data with hourly intervals)");
  } catch (error) {
    console.error("Error clearing sensor readings:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  clearSensorReadings()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nFatal error:", error);
      process.exit(1);
    });
}

export { clearSensorReadings };
