/**
 * Test script for WebSocket service
 */

import { createServer } from "http";
import express from "express";
import { initializeWebSocketService } from "../services";
import logger from "../utils/logger";
import {
  emitSensorReading,
  emitIncidentCreated,
  emitSystemMetrics,
} from "../utils/websocket";

async function testWebSocket() {
  logger.info("Starting WebSocket test...");

  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Initialize WebSocket service
  const wsService = initializeWebSocketService(httpServer);

  // Start server
  const PORT = 3002;
  httpServer.listen(PORT, () => {
    logger.info("Test server started", { port: PORT });
  });

  // Wait a moment for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test connection count
  logger.info("Connection count", {
    count: wsService.getConnectionCount(),
  });

  // Test emitting events
  logger.info("Testing event emissions...");

  // Emit sensor reading
  emitSensorReading({
    id: "test-reading-1",
    sensorId: "sensor-test-1",
    timestamp: new Date(),
    value: 75.5,
    unit: "°F",
    createdAt: new Date(),
  });

  // Emit incident
  emitIncidentCreated({
    id: "test-incident-1",
    type: "WASTE_OVERFLOW",
    category: "WASTE_OVERFLOW",
    severity: "HIGH",
    status: "ACTIVE",
    priorityScore: 85,
    confidence: 0.92,
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749],
    },
    zoneId: "zone-1",
    sensorId: "sensor-test-1",
    description: "Test incident for WebSocket",
    detectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Emit system metrics
  emitSystemMetrics({
    activeIncidents: 5,
    criticalIncidents: 2,
    activePredictions: 10,
    activeWorkOrders: 3,
    overallRiskLevel: 65,
    zoneStatus: {
      healthy: 3,
      warning: 2,
      critical: 1,
    },
  });

  logger.info("Event emissions completed");

  // Keep server running for manual testing
  logger.info(
    "WebSocket server is running. Connect a client to ws://localhost:3002"
  );
  logger.info("Press Ctrl+C to stop");

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Shutting down...");
    await wsService.close();
    httpServer.close();
    process.exit(0);
  });
}

// Run test
testWebSocket().catch((error) => {
  logger.error("Test failed", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
