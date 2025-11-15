/**
 * Sensor API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import sensorService from "../services/SensorService";
import logger from "../utils/logger";

const router = Router();

/**
 * @swagger
 * /api/v1/sensors:
 *   get:
 *     summary: Get all sensors
 *     description: Retrieve a list of all sensors in the system with their current status and last reading
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sensors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 *                 count:
 *                   type: integer
 *                   example: 50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/sensors/{id}:
 *   get:
 *     summary: Get specific sensor details
 *     description: Retrieve detailed information about a specific sensor including its configuration and current state
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Sensor'
 *                 - type: object
 *                   properties:
 *                     config:
 *                       type: object
 *                       properties:
 *                         baseValue:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         interval:
 *                           type: integer
 *                         thresholds:
 *                           type: object
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/sensors/{id}/readings:
 *   get:
 *     summary: Get sensor readings
 *     description: Retrieve historical readings for a specific sensor with optional time range filtering
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of readings to return
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time for reading range (ISO 8601 format)
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time for reading range (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Sensor readings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensorId:
 *                   type: string
 *                   format: uuid
 *                 readings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorReading'
 *                 count:
 *                   type: integer
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/sensors/{id}/configure:
 *   post:
 *     summary: Update sensor configuration
 *     description: Update the configuration parameters for a sensor simulation
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseValue:
 *                 type: number
 *                 description: Base value for sensor readings
 *               anomalyProbability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Probability of anomaly injection
 *               interval:
 *                 type: integer
 *                 description: Reading interval in milliseconds
 *           example:
 *             baseValue: 50
 *             anomalyProbability: 0.05
 *             interval: 10000
 *     responses:
 *       200:
 *         description: Sensor configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 config:
 *                   type: object
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/sensors/{id}/start:
 *   post:
 *     summary: Start sensor simulation
 *     description: Start the data generation simulation for a specific sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor simulation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sensorId:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/sensors/{id}/stop:
 *   post:
 *     summary: Stop sensor simulation
 *     description: Stop the data generation simulation for a specific sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor simulation stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sensorId:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
