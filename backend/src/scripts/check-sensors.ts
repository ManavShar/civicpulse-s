import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSensors() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        type,
        ST_AsGeoJSON(location) as location_geojson,
        status
      FROM sensors 
      LIMIT 5
    `);

    console.log(
      `\nFound ${result.rowCount} sensors in database (showing first 5):\n`
    );

    result.rows.forEach((sensor, index) => {
      console.log(`${index + 1}. ${sensor.name} (${sensor.type})`);
      console.log(`   ID: ${sensor.id}`);
      console.log(`   Status: ${sensor.status}`);
      console.log(`   Location: ${sensor.location_geojson || "NULL"}`);
      console.log("");
    });

    const totalCount = await pool.query("SELECT COUNT(*) FROM sensors");
    console.log(`Total sensors in database: ${totalCount.rows[0].count}\n`);
  } catch (error) {
    console.error("Error checking sensors:", error);
  } finally {
    await pool.end();
  }
}

checkSensors();
