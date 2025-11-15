import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Dubai coordinates bounds
const DUBAI_BOUNDS = {
  minLng: 55.1,
  maxLng: 55.5,
  minLat: 25.0,
  maxLat: 25.4,
};

function randomCoordinate(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateDubaiLocation() {
  return {
    type: "Point",
    coordinates: [
      randomCoordinate(DUBAI_BOUNDS.minLng, DUBAI_BOUNDS.maxLng),
      randomCoordinate(DUBAI_BOUNDS.minLat, DUBAI_BOUNDS.maxLat),
    ],
  };
}

async function addLocations() {
  try {
    console.log("Adding locations to sensors and incidents in Dubai...\n");

    // Update sensors
    const sensorsResult = await pool.query(
      "SELECT id FROM sensors WHERE location IS NULL"
    );
    console.log(`Found ${sensorsResult.rows.length} sensors without location`);

    for (const sensor of sensorsResult.rows) {
      const location = generateDubaiLocation();
      await pool.query(
        `UPDATE sensors 
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
         WHERE id = $3`,
        [location.coordinates[0], location.coordinates[1], sensor.id]
      );
    }
    console.log(
      `✓ Updated ${sensorsResult.rows.length} sensors with Dubai locations\n`
    );

    // Update incidents
    const incidentsResult = await pool.query(
      "SELECT id FROM incidents WHERE location IS NULL"
    );
    console.log(
      `Found ${incidentsResult.rows.length} incidents without location`
    );

    for (const incident of incidentsResult.rows) {
      const location = generateDubaiLocation();
      await pool.query(
        `UPDATE incidents 
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
         WHERE id = $3`,
        [location.coordinates[0], location.coordinates[1], incident.id]
      );
    }
    console.log(
      `✓ Updated ${incidentsResult.rows.length} incidents with Dubai locations\n`
    );

    // Update work orders
    const workOrdersResult = await pool.query(
      "SELECT id FROM work_orders WHERE location IS NULL"
    );
    console.log(
      `Found ${workOrdersResult.rows.length} work orders without location`
    );

    for (const workOrder of workOrdersResult.rows) {
      const location = generateDubaiLocation();
      await pool.query(
        `UPDATE work_orders 
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
         WHERE id = $3`,
        [location.coordinates[0], location.coordinates[1], workOrder.id]
      );
    }
    console.log(
      `✓ Updated ${workOrdersResult.rows.length} work orders with Dubai locations\n`
    );

    console.log("✅ All locations updated successfully!");
  } catch (error) {
    console.error("Error adding locations:", error);
  } finally {
    await pool.end();
  }
}

addLocations();
