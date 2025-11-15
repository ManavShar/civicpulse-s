import { Router, Request, Response } from "express";
import logger from "../utils/logger";
import db from "../db/connection";
import redisClient from "../db/redis";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns basic health status - always returns 200 if server is running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 service:
 *                   type: string
 *                   example: civicpulse-backend
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
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Checks if the service is ready to accept traffic by verifying database, Redis, and other critical dependencies
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     redis:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     agentService:
 *                       type: string
 *                       enum: [healthy, unhealthy, pending]
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not_ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                 error:
 *                   type: string
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
