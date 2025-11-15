/**
 * Quick script to check sensor reading counts
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSensorData() {
  const client = await pool.connect();

  try {
    console.log("\n=== Checking Sensor Data ===\n");

    // Count total sensors
    const sensorCount = await client.query("SELECT COUNT(*) FROM sensors");
    console.log(`Total sensors: ${sensorCount.rows[0].count}`);

    // Count total readings
    const readingCount = await client.query(
      "SELECT COUNT(*) FROM sensor_readings"
    );
    console.log(`Total readings: ${readingCount.rows[0].count}`);

    // Check readings per sensor
    const readingsPerSensor = await client.query(`
      SELECT 
        s.id,
        s.name,
        s.type,
        COUNT(sr.id) as reading_count
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      GROUP BY s.id, s.name, s.type
      ORDER BY reading_count DESC
      LIMIT 10
    `);

    console.log("\nTop 10 sensors by reading count:");
    readingsPerSensor.rows.forEach((row) => {
      const status = row.reading_count >= 50 ? "✅" : "❌";
      console.log(
        `  ${status} ${row.name} (${row.type}): ${row.reading_count} readings`
      );
    });

    // Count sensors with insufficient data
    const insufficientData = await client.query(`
      SELECT COUNT(DISTINCT s.id) as count
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      GROUP BY s.id
      HAVING COUNT(sr.id) < 50
    `);

    console.log(
      `\nSensors with < 50 readings (insufficient for ML): ${
        insufficientData.rows[0]?.count || 0
      }`
    );

    if (parseInt(readingCount.rows[0].count) < 1000) {
      console.log("\n⚠️  WARNING: Very few sensor readings found!");
      console.log("   Run the seed script to generate historical data:");
      console.log("   npm run seed:historical");
    } else {
      console.log("\n✅ Sufficient data available for predictions");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkSensorData().catch(console.error);
