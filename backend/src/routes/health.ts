import { Router, Request, Response } from "express";
import logger from "../utils/logger";
import db from "../db/connection";

const router = Router();

/**
 * Health check endpoint
 * Returns basic health status - always returns 200 if server is running
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "civicpulse-backend",
  });
});

/**
 * Readiness check endpoint
 * Checks if the service is ready to accept traffic
 * Should verify database, redis, and other critical dependencies
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await db.testConnection();

    // TODO: Add additional dependency checks in future tasks
    // - Redis connection check (task 3.3)
    // - Agent service connectivity check (later task)

    const checks = {
      database: dbHealthy ? "healthy" : "unhealthy",
      redis: "pending", // Will be implemented in task 3.3
      agentService: "pending", // Will be implemented later
    };

    const allHealthy = dbHealthy;

    if (allHealthy) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks,
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks,
      });
    }
  } catch (error) {
    logger.error("Readiness check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      requestId: req.id,
    });

    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: "Service dependencies not available",
    });
  }
});

export default router;
