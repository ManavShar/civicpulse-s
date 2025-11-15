/**
 * Test ML Pipeline Integration
 */

import axios from "axios";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8002";

async function testMLPipeline() {
  console.log("\n=== Testing ML Pipeline Integration ===\n");

  const client = await pool.connect();

  try {
    // 1. Check ML service health
    console.log("1. Checking ML service health...");
    try {
      const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`);
      console.log(`   ✅ ML service is healthy: ${healthResponse.data.status}`);
    } catch (error: any) {
      console.log(`   ❌ ML service is not responding: ${error.message}`);
      return;
    }

    // 2. Get a sensor with readings
    console.log("\n2. Finding sensors with readings...");
    const sensorsWithReadings = await client.query(`
      SELECT 
        s.id,
        s.name,
        s.type,
        COUNT(sr.id) as reading_count
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      GROUP BY s.id, s.name, s.type
      HAVING COUNT(sr.id) > 0
      ORDER BY COUNT(sr.id) DESC
      LIMIT 5
    `);

    if (sensorsWithReadings.rows.length === 0) {
      console.log("   ❌ No sensors with readings found");
      return;
    }

    console.log(
      `   Found ${sensorsWithReadings.rows.length} sensors with readings:`
    );
    sensorsWithReadings.rows.forEach((row) => {
      const status = row.reading_count >= 50 ? "✅" : "❌";
      console.log(
        `   ${status} ${row.name} (${row.type}): ${row.reading_count} readings`
      );
    });

    // 3. Test forecast for first sensor
    const testSensor = sensorsWithReadings.rows[0];
    console.log(`\n3. Testing forecast for sensor: ${testSensor.name}`);
    console.log(`   Sensor ID: ${testSensor.id}`);
    console.log(`   Reading count: ${testSensor.reading_count}`);

    try {
      const forecastResponse = await axios.get(
        `${ML_SERVICE_URL}/api/ml/forecast/${testSensor.id}`,
        {
          params: {
            limit: 1000,
            horizons: "1,6,12,24",
          },
          timeout: 30000,
        }
      );

      console.log(`   ✅ Forecast generated successfully!`);
      console.log(`   Predictions: ${forecastResponse.data.length}`);

      if (forecastResponse.data.length > 0) {
        const sample = forecastResponse.data[0];
        console.log(`   Sample prediction:`);
        console.log(`     - Timestamp: ${sample.predicted_timestamp}`);
        console.log(`     - Value: ${sample.predicted_value}`);
        console.log(`     - Confidence: ${sample.confidence}`);
        console.log(`     - Horizon: ${sample.horizon_hours}h`);
      }
    } catch (error: any) {
      console.log(
        `   ❌ Forecast failed: ${error.response?.status} ${error.response?.statusText}`
      );
      if (error.response?.data) {
        console.log(
          `   Error details: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
    }

    // 4. Check predictions table
    console.log("\n4. Checking predictions table...");
    const predictionCount = await client.query(
      "SELECT COUNT(*) FROM predictions"
    );
    console.log(
      `   Total predictions in database: ${predictionCount.rows[0].count}`
    );

    if (parseInt(predictionCount.rows[0].count) > 0) {
      const recentPredictions = await client.query(`
        SELECT 
          sensor_id,
          predicted_timestamp,
          predicted_value,
          confidence,
          created_at
        FROM predictions
        ORDER BY created_at DESC
        LIMIT 3
      `);

      console.log(`   Recent predictions:`);
      recentPredictions.rows.forEach((pred) => {
        console.log(
          `     - ${pred.predicted_timestamp}: ${pred.predicted_value} (confidence: ${pred.confidence})`
        );
      });
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log("\n=== Test Complete ===\n");
}

testMLPipeline().catch(console.error);
