import { Router, Request, Response } from "express";
import logger from "../utils/logger";
import db from "../db/connection";
import redisClient from "../db/redis";

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

    // Check Redis connection
    const redisHealthy = await redisClient.testConnection();

    // TODO: Add additional dependency checks in future tasks
    // - Agent service connectivity check (later task)

    const checks = {
      database: dbHealthy ? "healthy" : "unhealthy",
      redis: redisHealthy ? "healthy" : "unhealthy",
      agentService: "pending", // Will be implemented later
    };

    const allHealthy = dbHealthy && redisHealthy;

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
