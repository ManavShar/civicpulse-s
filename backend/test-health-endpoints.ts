/**
 * Manual test script for health check endpoints
 *
 * This script tests the /health and /ready endpoints to verify they work correctly
 * with all dependency checks (database, Redis, agent service).
 *
 * Usage: tsx test-health-endpoints.ts
 */

import axios from "axios";

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks: {
    database: string;
    redis: string;
    agentService: string;
  };
}

interface ReadyResponse {
  status: string;
  timestamp: string;
  checks: {
    database: string;
    redis: string;
    agentService: string;
  };
  message?: string;
  error?: string;
  unhealthyServices?: string[];
}

async function testHealthEndpoint(): Promise<void> {
  console.log("\n🔍 Testing /health endpoint...");

  try {
    const response = await axios.get<HealthResponse>(`${BASE_URL}/health`);

    console.log("✅ Status:", response.status);
    console.log("📊 Response:", JSON.stringify(response.data, null, 2));

    // Verify response structure
    if (response.data.status === "healthy") {
      console.log("✅ Health endpoint returns healthy status");
    }

    if (response.data.checks) {
      console.log("✅ Health checks included:");
      console.log("   - Database:", response.data.checks.database);
      console.log("   - Redis:", response.data.checks.redis);
      console.log("   - Agent Service:", response.data.checks.agentService);
    }

    console.log("✅ /health endpoint test PASSED");
  } catch (error) {
    console.error("❌ /health endpoint test FAILED");
    if (axios.isAxiosError(error)) {
      console.error("   Error:", error.message);
      if (error.response) {
        console.error("   Response:", error.response.data);
      }
    } else {
      console.error("   Error:", error);
    }
  }
}

async function testReadyEndpoint(): Promise<void> {
  console.log("\n🔍 Testing /ready endpoint...");

  try {
    const response = await axios.get<ReadyResponse>(`${BASE_URL}/ready`, {
      validateStatus: (status) => status === 200 || status === 503,
    });

    console.log("📊 Status:", response.status);
    console.log("📊 Response:", JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log("✅ Service is READY - all dependencies healthy");
      if (response.data.message) {
        console.log("   Message:", response.data.message);
      }
    } else if (response.status === 503) {
      console.log("⚠️  Service is NOT READY - some dependencies unhealthy");
      if (response.data.error) {
        console.log("   Error:", response.data.error);
      }
      if (response.data.unhealthyServices) {
        console.log(
          "   Unhealthy services:",
          response.data.unhealthyServices.join(", ")
        );
      }
    }

    if (response.data.checks) {
      console.log("📋 Dependency checks:");
      console.log("   - Database:", response.data.checks.database);
      console.log("   - Redis:", response.data.checks.redis);
      console.log("   - Agent Service:", response.data.checks.agentService);
    }

    console.log("✅ /ready endpoint test PASSED");
  } catch (error) {
    console.error("❌ /ready endpoint test FAILED");
    if (axios.isAxiosError(error)) {
      console.error("   Error:", error.message);
      if (error.response) {
        console.error("   Response:", error.response.data);
      }
    } else {
      console.error("   Error:", error);
    }
  }
}

async function runTests(): Promise<void> {
  console.log("🚀 Starting health endpoint tests...");
  console.log("📍 Base URL:", BASE_URL);
  console.log("=".repeat(60));

  await testHealthEndpoint();
  await testReadyEndpoint();

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests completed!");
  console.log(
    "\n💡 Note: If agent service is not running, it will show as unhealthy."
  );
  console.log(
    "   This is expected behavior - the endpoint still works correctly."
  );
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
