/**
 * Data transformation utilities for converting API responses to frontend types
 */

import { Prediction } from "@/types";

/**
 * Transform snake_case prediction from API to camelCase Prediction type
 */
export const transformPrediction = (pred: any): Prediction => ({
  id: pred.id,
  sensorId: pred.sensor_id,
  predictedTimestamp: new Date(pred.predicted_timestamp),
  predictedValue: pred.predicted_value,
  confidence: pred.confidence,
  lowerBound: pred.lower_bound,
  upperBound: pred.upper_bound,
  modelVersion: pred.model_version,
});

/**
 * Transform array of predictions
 */
export const transformPredictions = (predictions: any[]): Prediction[] => {
  if (!Array.isArray(predictions)) {
    return [];
  }
  return predictions.map(transformPrediction);
};
