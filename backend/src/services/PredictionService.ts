/**
 * Prediction Service
 * Manages predictive analytics and forecasting
 */

import axios, { AxiosInstance } from "axios";
import Bull, { Queue, Job } from "bull";
import logger from "../utils/logger";
import { PredictionRepository } from "../repositories/PredictionRepository";
import { SensorRepository } from "../repositories/SensorRepository";
import { IncidentRepository } from "../repositories/IncidentRepository";
import { cacheService } from "./CacheService";
import { getWebSocketService } from "./WebSocketService";

interface Prediction {
  sensor_id: string;
  predicted_timestamp: Date;
  predicted_value: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  model_version: string;
  horizon_hours?: number;
}

interface ForecastResponse {
  sensor_id: string;
  predicted_timestamp: string;
  predicted_value: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  model_version: string;
  horizon_hours: number;
}

interface PredictionFilters {
  sensor_id?: string;
  min_confidence?: number;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
}

export class PredictionService {
  private mlClient: AxiosInstance;
  private predictionQueue: Queue;
  private predictionRepository: PredictionRepository;
  private sensorRepository: SensorRepository;
  private incidentRepository: IncidentRepository;

  constructor() {
    // Initialize ML service client
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8002";
    this.mlClient = axios.create({
      baseURL: mlServiceUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Initialize Bull queue for background jobs
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.predictionQueue = new Bull("predictions", redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // Initialize repositories
    this.predictionRepository = new PredictionRepository();
    this.sensorRepository = new SensorRepository();
    this.incidentRepository = new IncidentRepository();

    // Set up queue processors
    this.setupQueueProcessors();

    logger.info("PredictionService initialized");
  }

  /**
   * Set up queue processors for background jobs
   */
  private setupQueueProcessors(): void {
    // Process prediction generation jobs
    this.predictionQueue.process(
      "generate-predictions",
      async (job: Job<{ sensor_id: string }>) => {
        const { sensor_id } = job.data;
        logger.info(`Processing prediction job for sensor ${sensor_id}`);

        try {
          await this.generatePredictionsForSensor(sensor_id);
          return { success: true, sensor_id };
        } catch (error) {
          logger.error(`Error in prediction job for sensor ${sensor_id}:`, {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }
    );

    // Process batch prediction jobs
    this.predictionQueue.process("generate-batch-predictions", async () => {
      logger.info("Processing batch prediction job");

      try {
        await this.generateBatchPredictions();
        return { success: true };
      } catch (error) {
        logger.error("Error in batch prediction job:", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    });

    // Log queue events
    this.predictionQueue.on("completed", (job, result) => {
      logger.debug(`Job ${job.id} completed`, { result });
    });

    this.predictionQueue.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed`, {
        error: err.message,
        data: job?.data,
      });
    });

    logger.info("Prediction queue processors set up");
  }

  /**
   * Schedule recurring prediction generation
   * Runs every 15 minutes
   */
  public async scheduleRecurringPredictions(): Promise<void> {
    try {
      // Add repeatable job for batch predictions
      await this.predictionQueue.add(
        "generate-batch-predictions",
        {},
        {
          repeat: {
            cron: "*/15 * * * *", // Every 15 minutes
          },
          jobId: "batch-predictions-recurring",
        }
      );

      logger.info(
        "Scheduled recurring prediction generation (every 15 minutes)"
      );
    } catch (error) {
      logger.error("Error scheduling recurring predictions:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Generate predictions for a specific sensor
   */
  public async generatePredictionsForSensor(
    sensor_id: string
  ): Promise<Prediction[]> {
    try {
      // Fetch historical sensor readings from SensorReadingRepository
      const sensorReadingRepo = new (
        await import("../repositories/SensorReadingRepository")
      ).SensorReadingRepository();
      const readings = await sensorReadingRepo.findAll(
        [{ field: "sensor_id", operator: "=", value: sensor_id }],
        [{ field: "timestamp", direction: "DESC" }],
        { limit: 1000 }
      );

      if (readings.length < 50) {
        logger.warn(
          `Insufficient data for sensor ${sensor_id}: ${readings.length} readings`
        );
        return [];
      }

      // Call ML service to generate forecast
      const response = await this.mlClient.get<ForecastResponse[]>(
        `/api/ml/forecast/${sensor_id}`,
        {
          params: {
            limit: 1000,
            horizons: "1,6,12,24",
          },
        }
      );

      const forecasts = response.data;

      if (!forecasts || forecasts.length === 0) {
        logger.warn(`No predictions generated for sensor ${sensor_id}`);
        return [];
      }

      // Convert to Prediction objects
      const predictions: Prediction[] = forecasts.map((f) => ({
        sensor_id: f.sensor_id,
        predicted_timestamp: new Date(f.predicted_timestamp),
        predicted_value: f.predicted_value,
        confidence: f.confidence,
        lower_bound: f.lower_bound,
        upper_bound: f.upper_bound,
        model_version: f.model_version,
        horizon_hours: f.horizon_hours,
      }));

      // Store predictions in database
      await this.predictionRepository.createBatch(predictions);

      // Check for predictive incidents
      await this.checkPredictiveThresholds(predictions);

      // Invalidate cache
      await cacheService.invalidate(`predictions:sensor:${sensor_id}`);

      // Broadcast predictions via WebSocket
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastPredictions(predictions);
      }

      logger.info(
        `Generated ${predictions.length} predictions for sensor ${sensor_id}`
      );

      return predictions;
    } catch (error) {
      logger.error(`Error generating predictions for sensor ${sensor_id}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Generate predictions for all active sensors
   */
  public async generateBatchPredictions(): Promise<void> {
    try {
      // Fetch all active sensors
      const sensors = await this.sensorRepository.findAll();

      logger.info(`Generating predictions for ${sensors.length} sensors`);

      // Queue prediction jobs for each sensor
      const jobs = sensors.map((sensor) =>
        this.predictionQueue.add("generate-predictions", {
          sensor_id: sensor.id,
        })
      );

      await Promise.all(jobs);

      logger.info(`Queued ${jobs.length} prediction jobs`);
    } catch (error) {
      logger.error("Error generating batch predictions:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Check predictions against thresholds and create predictive incidents
   */
  private async checkPredictiveThresholds(
    predictions: Prediction[]
  ): Promise<void> {
    try {
      for (const prediction of predictions) {
        // Get sensor details
        const sensor = await this.sensorRepository.findById(
          prediction.sensor_id
        );

        if (!sensor) {
          continue;
        }

        // Get thresholds from sensor metadata
        const thresholds = sensor.metadata?.thresholds || {
          warning: 80,
          critical: 100,
        };

        // Check if predicted value exceeds thresholds
        const exceedsWarning = prediction.predicted_value > thresholds.warning;
        const exceedsCritical =
          prediction.predicted_value > thresholds.critical;

        if (exceedsCritical || exceedsWarning) {
          // Create predictive incident
          const incident = await this.incidentRepository.create({
            type: "PREDICTIVE",
            category: this.getSensorCategory(sensor.type),
            severity: exceedsCritical ? "CRITICAL" : "HIGH",
            status: "ACTIVE",
            priorityScore: exceedsCritical ? 90 : 70,
            confidence: prediction.confidence,
            location: sensor.location,
            zoneId: sensor.zoneId,
            sensorId: sensor.id,
            description: `Predicted ${
              sensor.type
            } anomaly at ${prediction.predicted_timestamp.toISOString()}. Expected value: ${prediction.predicted_value.toFixed(
              2
            )}`,
            metadata: {
              prediction_id: prediction.sensor_id,
              predicted_value: prediction.predicted_value,
              predicted_timestamp: prediction.predicted_timestamp,
              horizon_hours: prediction.horizon_hours,
              confidence: prediction.confidence,
              threshold_exceeded: exceedsCritical ? "critical" : "warning",
            },
            detectedAt: new Date(),
          });

          logger.info(
            `Created predictive incident ${incident.id} for sensor ${sensor.id}`
          );

          // Broadcast incident via WebSocket
          const wsService = getWebSocketService();
          if (wsService) {
            wsService.broadcastIncident("created", incident);
          }
        }
      }
    } catch (error) {
      logger.error("Error checking predictive thresholds:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get incident category from sensor type
   */
  private getSensorCategory(sensorType: string): any {
    const categoryMap: Record<string, string> = {
      WASTE: "WASTE_OVERFLOW",
      LIGHT: "LIGHTING_FAILURE",
      WATER: "WATER_ANOMALY",
      TRAFFIC: "TRAFFIC_CONGESTION",
      ENVIRONMENT: "ENVIRONMENTAL_HAZARD",
      NOISE: "NOISE_COMPLAINT",
    };

    return categoryMap[sensorType] || "ENVIRONMENTAL_HAZARD";
  }

  /**
   * Get predictions with filters
   */
  public async getPredictions(
    filters: PredictionFilters = {}
  ): Promise<Prediction[]> {
    try {
      // Try cache first
      const cacheKey = `predictions:${JSON.stringify(filters)}`;
      const cached = await cacheService.get<Prediction[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Fetch from database
      const predictions = await this.predictionRepository.findWithFilters(
        filters
      );

      // Cache for 5 minutes
      await cacheService.set(cacheKey, predictions, 300);

      return predictions;
    } catch (error) {
      logger.error("Error getting predictions:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get predictions for a specific sensor
   */
  public async getPredictionsForSensor(
    sensor_id: string,
    limit: number = 100
  ): Promise<Prediction[]> {
    try {
      // Try cache first
      const cacheKey = `predictions:sensor:${sensor_id}`;
      const cached = await cacheService.get<Prediction[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Fetch from database
      const predictions = await this.predictionRepository.findBySensor(
        sensor_id,
        limit
      );

      // Cache for 5 minutes
      await cacheService.set(cacheKey, predictions, 300);

      return predictions;
    } catch (error) {
      logger.error(`Error getting predictions for sensor ${sensor_id}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Trigger immediate prediction generation for a sensor
   */
  public async triggerPrediction(sensor_id: string): Promise<void> {
    try {
      await this.predictionQueue.add("generate-predictions", { sensor_id });
      logger.info(`Queued prediction job for sensor ${sensor_id}`);
    } catch (error) {
      logger.error(`Error triggering prediction for sensor ${sensor_id}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.predictionQueue.getWaitingCount(),
        this.predictionQueue.getActiveCount(),
        this.predictionQueue.getCompletedCount(),
        this.predictionQueue.getFailedCount(),
      ]);

      return { waiting, active, completed, failed };
    } catch (error) {
      logger.error("Error getting queue stats:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Close queue connections
   */
  public async close(): Promise<void> {
    await this.predictionQueue.close();
    logger.info("PredictionService closed");
  }
}

// Export singleton instance
const predictionService = new PredictionService();
export default predictionService;
