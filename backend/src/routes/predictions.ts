/**
 * Prediction Routes
 * API endpoints for predictions and forecasting
 */

import { Router, Request, Response, NextFunction } from "express";
import predictionService from "../services/PredictionService";
import logger from "../utils/logger";

const router = Router();

/**
 * @swagger
 * /api/v1/predictions:
 *   get:
 *     summary: Get all predictions
 *     description: Retrieve predictions with optional filtering by sensor, confidence, and time range
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sensor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sensor ID
 *       - in: query
 *         name: min_confidence
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Minimum confidence threshold
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter predictions after this time
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter predictions before this time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Predictions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 predictions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prediction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sensor_id, min_confidence, start_time, end_time, limit } =
      req.query;

    const filters: any = {};

    if (sensor_id) {
      filters.sensor_id = sensor_id as string;
    }

    if (min_confidence) {
      filters.min_confidence = parseFloat(min_confidence as string);
    }

    if (start_time) {
      filters.start_time = new Date(start_time as string);
    }

    if (end_time) {
      filters.end_time = new Date(end_time as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string);
    }

    const predictions = await predictionService.getPredictions(filters);

    res.json({
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    logger.error("Error in GET /predictions:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/predictions/{sensorId}:
 *   get:
 *     summary: Get predictions for a specific sensor
 *     description: Retrieve all predictions for a given sensor ID
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of predictions to return
 *     responses:
 *       200:
 *         description: Predictions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensor_id:
 *                   type: string
 *                   format: uuid
 *                 count:
 *                   type: integer
 *                 predictions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prediction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:sensorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sensorId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const predictions = await predictionService.getPredictionsForSensor(
        sensorId,
        limit
      );

      res.json({
        sensor_id: sensorId,
        count: predictions.length,
        predictions,
      });
    } catch (error) {
      logger.error(`Error in GET /predictions/${req.params.sensorId}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/predictions/generate/{sensorId}:
 *   post:
 *     summary: Trigger prediction generation for a specific sensor
 *     description: Queue a prediction generation job for the specified sensor
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Prediction generation queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prediction generation queued for sensor abc-123
 *                 sensor_id:
 *                   type: string
 *                   format: uuid
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/generate/:sensorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sensorId } = req.params;

      await predictionService.triggerPrediction(sensorId);

      res.json({
        message: `Prediction generation queued for sensor ${sensorId}`,
        sensor_id: sensorId,
      });
    } catch (error) {
      logger.error(
        `Error in POST /predictions/generate/${req.params.sensorId}:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/predictions/generate-batch:
 *   post:
 *     summary: Trigger batch prediction generation
 *     description: Queue prediction generation jobs for all sensors in the system
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Batch prediction generation queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Batch prediction generation queued for all sensors
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/generate-batch",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await predictionService.generateBatchPredictions();

      res.json({
        message: "Batch prediction generation queued for all sensors",
      });
    } catch (error) {
      logger.error("Error in POST /predictions/generate-batch:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/predictions/queue/stats:
 *   get:
 *     summary: Get prediction queue statistics
 *     description: Retrieve statistics about the prediction job queue (waiting, active, completed, failed)
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 waiting:
 *                   type: integer
 *                   description: Number of jobs waiting in queue
 *                 active:
 *                   type: integer
 *                   description: Number of jobs currently processing
 *                 completed:
 *                   type: integer
 *                   description: Number of completed jobs
 *                 failed:
 *                   type: integer
 *                   description: Number of failed jobs
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/queue/stats",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await predictionService.getQueueStats();

      res.json(stats);
    } catch (error) {
      logger.error("Error in GET /predictions/queue/stats:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

export default router;
