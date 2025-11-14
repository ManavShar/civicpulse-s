import { Router, Request, Response } from "express";
import logger from "../utils/logger";

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
    // TODO: Add actual dependency checks in future tasks
    // - Database connection check
    // - Redis connection check
    // - Agent service connectivity check

    const checks = {
      database: "pending", // Will be implemented in task 3.2
      redis: "pending", // Will be implemented in task 3.3
      agentService: "pending", // Will be implemented later
    };

    // For now, return ready status
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks,
    });
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
