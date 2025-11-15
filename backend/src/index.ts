import express, { Application } from "express";
import { createServer, Server as HTTPServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import logger from "./utils/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import sensorRoutes from "./routes/sensors";
import incidentRoutes from "./routes/incidents";
import predictionRoutes from "./routes/predictions";
import workOrderRoutes from "./routes/workOrders";
import replayRoutes from "./routes/replay";
import scenarioRoutes from "./routes/scenarios";
import {
  initializeWebSocketService,
  sensorService,
  predictionService,
  workOrderSimulator,
  scenarioService,
} from "./services";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Security middleware - helmet sets various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS middleware - allow cross-origin requests
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    })
  );

  // Compression middleware - compress response bodies
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request ID middleware - must be before logging
  app.use(requestIdMiddleware);

  // Logging middleware
  app.use(loggingMiddleware);

  // Health check routes (no /api prefix for infrastructure endpoints)
  app.use(healthRoutes);

  // Apply rate limiting to all API routes
  app.use("/api/", apiLimiter);

  // API v1 routes
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/sensors", sensorRoutes);
  app.use("/api/v1/incidents", incidentRoutes);
  app.use("/api/v1/predictions", predictionRoutes);
  app.use("/api/v1/work-orders", workOrderRoutes);
  app.use("/api/v1/replay", replayRoutes);
  app.use("/api/v1/scenarios", scenarioRoutes);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
}

/**
 * Start the Express server with WebSocket support
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();

    // Create HTTP server
    const httpServer: HTTPServer = createServer(app);

    // Initialize WebSocket service
    const wsService = initializeWebSocketService(httpServer);
    logger.info("WebSocket service initialized", {
      connectionCount: wsService.getConnectionCount(),
    });

    // Initialize sensor service
    await sensorService.initialize();

    // Try to load sensors from database, but don't fail if database is not available
    try {
      await sensorService.loadSensors();
      sensorService.startAllSimulations();
      logger.info("Sensor service initialized and simulations started");
    } catch (error) {
      logger.warn(
        "Could not load sensors from database - database may not be available yet",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
      logger.info(
        "Server will start without sensor simulations. Sensors can be loaded later."
      );
    }

    // Initialize prediction service and schedule recurring predictions
    try {
      await predictionService.scheduleRecurringPredictions();
      logger.info("Prediction service initialized with recurring jobs");
    } catch (error) {
      logger.warn("Could not schedule recurring predictions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info("CivicPulse AI Backend started", {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
        websocketEnabled: true,
      });
    });

    // Graceful shutdown handlers
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      await scenarioService.shutdown();
      await sensorService.shutdown();
      await predictionService.close();
      await workOrderSimulator.shutdown();
      await wsService.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT signal received: closing HTTP server");
      await scenarioService.shutdown();
      await sensorService.shutdown();
      await predictionService.close();
      await workOrderSimulator.shutdown();
      await wsService.close();
      process.exit(0);
    });

    // Unhandled rejection handler
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", {
        reason,
        promise,
      });
    });

    // Uncaught exception handler
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
export { createApp, startServer };
