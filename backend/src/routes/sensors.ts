/**
 * Sensor API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import sensorService from "../services/SensorService";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/sensors
 * Get all sensors
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sensors = await sensorService.getAllSensors();

    // Enrich with current state
    const enrichedSensors = sensors.map((sensor) => {
      const state = sensorService.getSimulator().getSensorState(sensor.id);
      return {
        ...sensor,
        status: state?.status || "offline",
        lastReading: state?.lastReading,
        lastReadingTime: state?.lastReadingTime,
      };
    });

    res.json({
      sensors: enrichedSensors,
      count: enrichedSensors.length,
    });
  } catch (error) {
    logger.error("Error fetching sensors", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
});

/**
 * GET /api/v1/sensors/:id
 * Get specific sensor details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sensor = await sensorService.getSensor(id);
    if (!sensor) {
      return res.status(404).json({
        error: {
          code: "SENSOR_NOT_FOUND",
          message: "Sensor not found",
        },
      });
    }

    // Get current state
    const state = sensorService.getSimulator().getSensorState(id);
    const config = sensorService.getSensorConfig(id);

    return res.json({
      ...sensor,
      status: state?.status || "offline",
      lastReading: state?.lastReading,
      lastReadingTime: state?.lastReadingTime,
      config: config
        ? {
            baseValue: config.baseValue,
            unit: config.unit,
            interval: config.interval,
            thresholds: config.thresholds,
          }
        : undefined,
    });
  } catch (error) {
    logger.error("Error fetching sensor", {
      sensorId: req.params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * GET /api/v1/sensors/:id/readings
 * Get sensor readings
 */
router.get(
  "/:id/readings",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const startTime = req.query.startTime
        ? new Date(req.query.startTime as string)
        : undefined;
      const endTime = req.query.endTime
        ? new Date(req.query.endTime as string)
        : undefined;

      // Validate sensor exists
      const sensor = await sensorService.getSensor(id);
      if (!sensor) {
        return res.status(404).json({
          error: {
            code: "SENSOR_NOT_FOUND",
            message: "Sensor not found",
          },
        });
      }

      let readings;
      if (startTime && endTime) {
        readings = await sensorService.getSensorReadingsInRange(
          id,
          startTime,
          endTime
        );
      } else {
        readings = await sensorService.getSensorReadings(id, limit);
      }

      return res.json({
        sensorId: id,
        readings,
        count: readings.length,
      });
    } catch (error) {
      logger.error("Error fetching sensor readings", {
        sensorId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/sensors/:id/configure
 * Update sensor configuration
 */
router.post(
  "/:id/configure",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate sensor exists
      const sensor = await sensorService.getSensor(id);
      if (!sensor) {
        return res.status(404).json({
          error: {
            code: "SENSOR_NOT_FOUND",
            message: "Sensor not found",
          },
        });
      }

      // Update configuration
      sensorService.updateSensorConfig(id, updates);

      // Get updated config
      const config = sensorService.getSensorConfig(id);

      return res.json({
        message: "Sensor configuration updated",
        config: config
          ? {
              baseValue: config.baseValue,
              unit: config.unit,
              interval: config.interval,
              thresholds: config.thresholds,
              anomalyProbability: config.anomalyProbability,
            }
          : undefined,
      });
    } catch (error) {
      logger.error("Error updating sensor configuration", {
        sensorId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/sensors/:id/start
 * Start sensor simulation
 */
router.post(
  "/:id/start",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate sensor exists
      const sensor = await sensorService.getSensor(id);
      if (!sensor) {
        return res.status(404).json({
          error: {
            code: "SENSOR_NOT_FOUND",
            message: "Sensor not found",
          },
        });
      }

      sensorService.startSimulation(id);

      return res.json({
        message: "Sensor simulation started",
        sensorId: id,
      });
    } catch (error) {
      logger.error("Error starting sensor simulation", {
        sensorId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/sensors/:id/stop
 * Stop sensor simulation
 */
router.post(
  "/:id/stop",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate sensor exists
      const sensor = await sensorService.getSensor(id);
      if (!sensor) {
        return res.status(404).json({
          error: {
            code: "SENSOR_NOT_FOUND",
            message: "Sensor not found",
          },
        });
      }

      sensorService.stopSimulation(id);

      return res.json({
        message: "Sensor simulation stopped",
        sensorId: id,
      });
    } catch (error) {
      logger.error("Error stopping sensor simulation", {
        sensorId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

export default router;
