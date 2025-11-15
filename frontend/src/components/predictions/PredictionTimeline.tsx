import { useMemo } from "react";
import { Prediction, Sensor } from "@/types";
import { format, addHours } from "date-fns";
import { Badge } from "@/components/ui";

interface PredictionTimelineProps {
  predictions: Prediction[];
  sensors: Sensor[];
  onPredictionClick?: (predictionId: string) => void;
}

export function PredictionTimeline({
  predictions,
  sensors,
  onPredictionClick,
}: PredictionTimelineProps) {
  // Group predictions by time horizon
  const timelineData = useMemo(() => {
    const now = new Date();
    const horizons = [1, 6, 12, 24]; // hours

    // Safety check: ensure predictions is an array
    const predictionsArray = Array.isArray(predictions) ? predictions : [];

    return horizons.map((hours) => {
      const targetTime = addHours(now, hours);
      const relevantPredictions = predictionsArray.filter((pred) => {
        const predTime = new Date(pred.predictedTimestamp);
        const diffHours =
          (predTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return Math.abs(diffHours - hours) < 1; // Within 1 hour of target
      });

      // Filter for high-risk predictions (high confidence + high value)
      const highRiskPredictions = relevantPredictions.filter(
        (pred) => pred.confidence >= 0.7 && pred.predictedValue > 80
      );

      return {
        hours,
        time: targetTime,
        predictions: relevantPredictions,
        highRiskCount: highRiskPredictions.length,
        totalCount: relevantPredictions.length,
      };
    });
  }, [predictions]);

  const getSensorName = (sensorId: string): string => {
    const sensor = sensors.find((s) => s.id === sensorId);
    return sensor?.name || `Sensor ${sensorId.slice(0, 8)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Prediction Timeline
      </h3>

      <div className="space-y-4">
        {timelineData.map((horizon) => (
          <div
            key={horizon.hours}
            className="border-l-4 border-blue-500 pl-4 py-2"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {horizon.hours}h from now
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {format(horizon.time, "MMM d, HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {horizon.highRiskCount > 0 && (
                  <Badge variant="warning" size="sm">
                    ⚠️ {horizon.highRiskCount} warning
                    {horizon.highRiskCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                <Badge variant="info" size="sm">
                  {horizon.totalCount} prediction
                  {horizon.totalCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            {horizon.predictions.length > 0 && (
              <div className="space-y-2 mt-2">
                {horizon.predictions.slice(0, 3).map((pred) => {
                  const isHighRisk =
                    pred.confidence >= 0.7 && pred.predictedValue > 80;

                  return (
                    <div
                      key={pred.id}
                      onClick={() => onPredictionClick?.(pred.id)}
                      className={`
                        p-2 rounded-lg cursor-pointer transition-colors
                        ${
                          isHighRisk
                            ? "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                            : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getSensorName(pred.sensorId)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Predicted: {pred.predictedValue.toFixed(1)} (
                            {(pred.confidence * 100).toFixed(0)}% confidence)
                          </p>
                        </div>
                        {isHighRisk && (
                          <span className="text-yellow-600 dark:text-yellow-400 text-lg">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {horizon.predictions.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    +{horizon.predictions.length - 3} more predictions
                  </p>
                )}
              </div>
            )}

            {horizon.predictions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                No predictions for this time horizon
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total Predictions:
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {Array.isArray(predictions) ? predictions.length : 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-400">
            High Risk Warnings:
          </span>
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            {
              (Array.isArray(predictions) ? predictions : []).filter(
                (p) => p.confidence >= 0.7 && p.predictedValue > 80
              ).length
            }
          </span>
        </div>
      </div>
    </div>
  );
}
