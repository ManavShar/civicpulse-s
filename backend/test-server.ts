/**
 * Simple test script to verify the Express server starts correctly
 * and health endpoints are working
 */
import axios from "axios";

const BASE_URL = "http://localhost:4000";

async function testServer() {
  console.log("Testing CivicPulse Backend Server...\n");

  try {
    // Test health endpoint
    console.log("1. Testing /health endpoint...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✓ Health check passed:", healthResponse.data);
    console.log("  Status:", healthResponse.status);
    console.log(
      "  Headers:",
      healthResponse.headers["x-request-id"]
        ? "✓ Request ID present"
        : "✗ Request ID missing"
    );
    console.log();

    // Test ready endpoint
    console.log("2. Testing /ready endpoint...");
    const readyResponse = await axios.get(`${BASE_URL}/ready`);
    console.log("✓ Readiness check passed:", readyResponse.data);
    console.log("  Status:", readyResponse.status);
    console.log();

    // Test 404 handling
    console.log("3. Testing 404 error handling...");
    try {
      await axios.get(`${BASE_URL}/api/v1/nonexistent`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log("✓ 404 handler working correctly");
        console.log("  Error response:", error.response.data);
        console.log();
      } else {
        throw error;
      }
    }

    console.log("✅ All tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Wait a bit for server to start
setTimeout(testServer, 2000);
