import { Prediction, Sensor } from "@/types";
import { Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { useMemo } from "react";

interface PredictionCardProps {
  prediction: Prediction;
  sensor?: Sensor;
  historicalData?: number[];
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function PredictionCard({
  prediction,
  sensor,
  historicalData = [],
  onSelect,
  isSelected = false,
}: PredictionCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(prediction.id);
    }
  };

  // Determine confidence level color
  const confidenceColor = useMemo(() => {
    if (prediction.confidence >= 0.8) return "success";
    if (prediction.confidence >= 0.6) return "warning";
    return "danger";
  }, [prediction.confidence]);

  // Determine if prediction indicates a warning
  const isWarning = useMemo(() => {
    // This would be based on threshold logic from the backend
    // For now, we'll use a simple heuristic
    return prediction.confidence > 0.7 && prediction.predictedValue > 80;
  }, [prediction]);

  // Format time horizon
  const timeHorizon = useMemo(() => {
    const now = new Date();
    const predicted = new Date(prediction.predictedTimestamp);
    const diffHours = Math.round(
      (predicted.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    return diffHours;
  }, [prediction.predictedTimestamp]);

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 border rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }
        ${isWarning ? "border-l-4 border-l-yellow-500" : ""}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sensor?.name || `Sensor ${prediction.sensorId.slice(0, 8)}`}
            </h3>
            {isWarning && (
              <Badge variant="warning" size="sm">
                ⚠️ Warning
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sensor?.type.replace("_", " ") || "Unknown Type"}
          </p>
        </div>
        <Badge variant={confidenceColor} size="md">
          {(prediction.confidence * 100).toFixed(0)}% confidence
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            Predicted Value
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {prediction.predictedValue.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            Time Horizon
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {timeHorizon}h
          </p>
        </div>
      </div>

      {/* Mini trend chart */}
      {historicalData.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Trend</p>
          <div className="h-12 w-full">
            <Sparkline
              data={[...historicalData, prediction.predictedValue]}
              color={isWarning ? "text-yellow-600" : "text-blue-600"}
              animate={false}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>
          Predicted{" "}
          {formatDistanceToNow(new Date(prediction.predictedTimestamp), {
            addSuffix: true,
          })}
        </span>
        <span>
          Range: {prediction.lowerBound.toFixed(1)} -{" "}
          {prediction.upperBound.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
