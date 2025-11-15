import { Router, Request, Response } from "express";
import axios from "axios";
import logger from "../utils/logger";
import db from "../db/connection";
import redisClient from "../db/redis";

const router = Router();

/**
 * Check agent service connectivity
 */
async function checkAgentService(): Promise<boolean> {
  const agentServiceUrl = process.env.AGENT_SERVICE_URL;

  if (!agentServiceUrl) {
    logger.warn("AGENT_SERVICE_URL not configured");
    return false;
  }

  try {
    const response = await axios.get(`${agentServiceUrl}/health`, {
      timeout: 2000, // 2 second timeout
      validateStatus: (status) => status === 200,
    });

    return response.status === 200;
  } catch (error) {
    logger.debug("Agent service health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: agentServiceUrl,
    });
    return false;
  }
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns basic health status with all service dependencies - always returns 200 if server is running
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
 *                 version:
 *                   type: string
 *                   example: 1.0.0
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
 *                       enum: [healthy, unhealthy]
 */
router.get("/health", async (_req: Request, res: Response) => {
  // Perform all health checks in parallel
  const [dbHealthy, redisHealthy, agentServiceHealthy] = await Promise.all([
    db.testConnection().catch(() => false),
    redisClient.testConnection().catch(() => false),
    checkAgentService().catch(() => false),
  ]);

  const checks = {
    database: dbHealthy ? "healthy" : "unhealthy",
    redis: redisHealthy ? "healthy" : "unhealthy",
    agentService: agentServiceHealthy ? "healthy" : "unhealthy",
  };

  // Health endpoint always returns 200 - it indicates the server is running
  // Individual component health is reported in the checks object
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "civicpulse-backend",
    version: process.env.npm_package_version || "1.0.0",
    checks,
  });
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Checks if the service is ready to accept traffic by verifying all critical dependencies (database, Redis, agent service)
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready - all critical dependencies are healthy
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
 *                       enum: [healthy, unhealthy]
 *                 message:
 *                   type: string
 *                   example: All dependencies are healthy
 *       503:
 *         description: Service is not ready - one or more dependencies are unhealthy
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
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     redis:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     agentService:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                 error:
 *                   type: string
 *                   example: Critical dependencies are not available
 *                 unhealthyServices:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [database, agentService]
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Perform all dependency checks in parallel for faster response
    const [dbHealthy, redisHealthy, agentServiceHealthy] = await Promise.all([
      db.testConnection().catch((error) => {
        logger.error("Database connectivity check failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestId: req.id,
        });
        return false;
      }),
      redisClient.testConnection().catch((error) => {
        logger.error("Redis connectivity check failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestId: req.id,
        });
        return false;
      }),
      checkAgentService().catch((error) => {
        logger.error("Agent service connectivity check failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestId: req.id,
        });
        return false;
      }),
    ]);

    const checks = {
      database: dbHealthy ? "healthy" : "unhealthy",
      redis: redisHealthy ? "healthy" : "unhealthy",
      agentService: agentServiceHealthy ? "healthy" : "unhealthy",
    };

    // Identify unhealthy services
    const unhealthyServices: string[] = [];
    if (!dbHealthy) unhealthyServices.push("database");
    if (!redisHealthy) unhealthyServices.push("redis");
    if (!agentServiceHealthy) unhealthyServices.push("agentService");

    // Service is ready only if all critical dependencies are healthy
    const allHealthy = dbHealthy && redisHealthy && agentServiceHealthy;

    if (allHealthy) {
      logger.debug("Readiness check passed - all dependencies healthy", {
        requestId: req.id,
      });

      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks,
        message: "All dependencies are healthy",
      });
    } else {
      logger.warn("Readiness check failed - unhealthy dependencies detected", {
        unhealthyServices,
        requestId: req.id,
      });

      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks,
        error: "Critical dependencies are not available",
        unhealthyServices,
      });
    }
  } catch (error) {
    logger.error("Readiness check encountered unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: req.id,
    });

    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: "Service dependencies check failed",
      checks: {
        database: "unknown",
        redis: "unknown",
        agentService: "unknown",
      },
    });
  }
});

export default router;
