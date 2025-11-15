/**
 * Prediction Routes
 * API endpoints for predictions and forecasting
 */

import { Router, Request, Response, NextFunction } from "express";
import predictionService from "../services/PredictionService";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/predictions
 * Get all predictions with optional filters
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
 * GET /api/v1/predictions/:sensorId
 * Get predictions for a specific sensor
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
 * POST /api/v1/predictions/generate/:sensorId
 * Trigger prediction generation for a specific sensor
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
 * POST /api/v1/predictions/generate-batch
 * Trigger batch prediction generation for all sensors
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
 * GET /api/v1/predictions/queue/stats
 * Get prediction queue statistics
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
