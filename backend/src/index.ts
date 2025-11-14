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
import healthRoutes from "./routes/health";
import { initializeWebSocketService } from "./services";

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

  // API routes will be added in subsequent tasks
  // app.use('/api/v1', apiRoutes);

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
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received: closing HTTP server");
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
