/**
 * Anomaly Detection Service
 * Implements statistical methods for detecting anomalies in sensor data
 */

import SensorReadingRepository from "../repositories/SensorReadingRepository";
import { CacheService } from "./CacheService";
import logger from "../utils/logger";

export interface BaselineStats {
  mean: number;
  stdDev: number;
  q1: number;
  q3: number;
  movingAvg: number;
  count: number;
  lastUpdated: Date;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  zScore: number;
  deviationPercent: number;
  methodsTriggered: string[];
  details: {
    zScoreTriggered: boolean;
    iqrTriggered: boolean;
    movingAvgTriggered: boolean;
  };
}

/**
 * AnomalyDetector class with statistical methods
 */
export class AnomalyDetector {
  private cacheService: CacheService;
  private readonly BASELINE_CACHE_TTL = 300; // 5 minutes
  private readonly BASELINE_SAMPLE_SIZE = 1000;
  private readonly MOVING_AVG_WINDOW = 100;
  private readonly Z_SCORE_THRESHOLD = 3;
  private readonly IQR_MULTIPLIER = 1.5;
  private readonly MA_DEVIATION_THRESHOLD = 0.3;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Detect anomaly using multiple statistical methods
   */
  async detectAnomaly(sensorId: string, value: number): Promise<AnomalyResult> {
    try {
      // Get baseline statistics
      const baseline = await this.getBaseline(sensorId);

      // Z-score method
      const zScore = this.calculateZScore(value, baseline);
      const isAnomalyZScore = Math.abs(zScore) > this.Z_SCORE_THRESHOLD;

      // IQR method
      const isAnomalyIQR = this.detectIQRAnomaly(value, baseline);

      // Moving average deviation method
      const maDeviation = this.calculateMovingAvgDeviation(value, baseline);
      const isAnomalyMA = maDeviation > this.MA_DEVIATION_THRESHOLD;

      // Combine methods
      const isAnomaly = isAnomalyZScore || isAnomalyIQR || isAnomalyMA;

      // Calculate confidence based on how many methods triggered
      const confidence = this.calculateConfidence(
        isAnomalyZScore,
        isAnomalyIQR,
        isAnomalyMA,
        zScore,
        maDeviation
      );

      // Build methods triggered list
      const methodsTriggered: string[] = [];
      if (isAnomalyZScore) methodsTriggered.push("z_score");
      if (isAnomalyIQR) methodsTriggered.push("iqr");
      if (isAnomalyMA) methodsTriggered.push("moving_avg");

      return {
        isAnomaly,
        confidence,
        zScore,
        deviationPercent: maDeviation,
        methodsTriggered,
        details: {
          zScoreTriggered: isAnomalyZScore,
          iqrTriggered: isAnomalyIQR,
          movingAvgTriggered: isAnomalyMA,
        },
      };
    } catch (error) {
      logger.error("Error detecting anomaly", {
        sensorId,
        value,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Calculate Z-score for a value
   */
  private calculateZScore(value: number, baseline: BaselineStats): number {
    if (baseline.stdDev === 0) {
      return 0;
    }
    return (value - baseline.mean) / baseline.stdDev;
  }

  /**
   * Detect anomaly using IQR (Interquartile Range) method
   */
  private detectIQRAnomaly(value: number, baseline: BaselineStats): boolean {
    const iqr = baseline.q3 - baseline.q1;
    const lowerBound = baseline.q1 - this.IQR_MULTIPLIER * iqr;
    const upperBound = baseline.q3 + this.IQR_MULTIPLIER * iqr;

    return value < lowerBound || value > upperBound;
  }

  /**
   * Calculate moving average deviation
   */
  private calculateMovingAvgDeviation(
    value: number,
    baseline: BaselineStats
  ): number {
    if (baseline.movingAvg === 0) {
      return 0;
    }
    return Math.abs(value - baseline.movingAvg) / Math.abs(baseline.movingAvg);
  }

  /**
   * Calculate confidence score based on multiple methods
   */
  private calculateConfidence(
    zScoreTriggered: boolean,
    iqrTriggered: boolean,
    maTriggered: boolean,
    zScore: number,
    maDeviation: number
  ): number {
    let confidence = 0;

    // Base confidence from number of methods triggered
    const methodCount =
      (zScoreTriggered ? 1 : 0) +
      (iqrTriggered ? 1 : 0) +
      (maTriggered ? 1 : 0);

    if (methodCount === 0) {
      return 0;
    }

    // Base confidence: 0.5 for 1 method, 0.7 for 2 methods, 0.9 for 3 methods
    confidence = 0.3 + methodCount * 0.2;

    // Adjust based on severity of deviation
    if (zScoreTriggered) {
      const zScoreSeverity = Math.min(Math.abs(zScore) / 10, 0.1);
      confidence += zScoreSeverity;
    }

    if (maTriggered) {
      const maSeverity = Math.min(maDeviation, 0.1);
      confidence += maSeverity;
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Get or calculate baseline statistics for a sensor
   */
  async getBaseline(sensorId: string): Promise<BaselineStats> {
    // Try to get from cache
    const cacheKey = `baseline:${sensorId}`;
    const cached = await this.cacheService.get<BaselineStats>(cacheKey);

    if (cached) {
      return cached;
    }

    // Calculate from database
    const baseline = await this.calculateBaseline(sensorId);

    // Cache for future use
    await this.cacheService.set(cacheKey, baseline, this.BASELINE_CACHE_TTL);

    return baseline;
  }

  /**
   * Calculate baseline statistics from historical data
   */
  private async calculateBaseline(sensorId: string): Promise<BaselineStats> {
    try {
      // Fetch recent readings
      const readings = await SensorReadingRepository.findBySensor(
        sensorId,
        this.BASELINE_SAMPLE_SIZE
      );

      if (readings.length === 0) {
        // Return default baseline if no data
        return {
          mean: 0,
          stdDev: 1,
          q1: 0,
          q3: 0,
          movingAvg: 0,
          count: 0,
          lastUpdated: new Date(),
        };
      }

      const values = readings.map((r) => r.value);

      // Calculate statistics
      const mean = this.calculateMean(values);
      const stdDev = this.calculateStdDev(values, mean);
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = this.calculatePercentile(sorted, 25);
      const q3 = this.calculatePercentile(sorted, 75);

      // Calculate moving average from most recent readings
      const recentValues = values.slice(
        0,
        Math.min(this.MOVING_AVG_WINDOW, values.length)
      );
      const movingAvg = this.calculateMean(recentValues);

      return {
        mean,
        stdDev,
        q1,
        q3,
        movingAvg,
        count: values.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error("Error calculating baseline", {
        sensorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Calculate mean of values
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile from sorted values
   */
  private calculatePercentile(
    sortedValues: number[],
    percentile: number
  ): number {
    if (sortedValues.length === 0) return 0;

    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Invalidate baseline cache for a sensor
   */
  async invalidateBaseline(sensorId: string): Promise<void> {
    const cacheKey = `baseline:${sensorId}`;
    await this.cacheService.invalidate(cacheKey);
    logger.debug("Invalidated baseline cache", { sensorId });
  }

  /**
   * Recalculate and update baseline for a sensor
   */
  async refreshBaseline(sensorId: string): Promise<BaselineStats> {
    await this.invalidateBaseline(sensorId);
    return this.getBaseline(sensorId);
  }
}

// Create singleton instance
const anomalyDetector = new AnomalyDetector(require("./CacheService").default);

export default anomalyDetector;
