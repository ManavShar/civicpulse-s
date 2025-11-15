import { useMemo } from "react";
import { Prediction, Sensor, SensorReading } from "@/types";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface PredictionDetailProps {
  prediction: Prediction;
  sensor?: Sensor;
  historicalReadings?: SensorReading[];
  onClose?: () => void;
}

export function PredictionDetail({
  prediction,
  sensor,
  historicalReadings = [],
  onClose,
}: PredictionDetailProps) {
  // Prepare chart data combining historical and predicted values
  const chartData = useMemo(() => {
    const historical = historicalReadings.map((reading) => ({
      timestamp: new Date(reading.timestamp).getTime(),
      value: reading.value,
      type: "historical",
      label: format(new Date(reading.timestamp), "HH:mm"),
    }));

    const predicted = {
      timestamp: new Date(prediction.predictedTimestamp).getTime(),
      value: prediction.predictedValue,
      lowerBound: prediction.lowerBound,
      upperBound: prediction.upperBound,
      type: "predicted",
      label: format(new Date(prediction.predictedTimestamp), "HH:mm"),
    };

    return [...historical, predicted].sort((a, b) => a.timestamp - b.timestamp);
  }, [historicalReadings, prediction]);

  // Determine confidence level
  const confidenceLevel = useMemo(() => {
    if (prediction.confidence >= 0.8)
      return { label: "High", color: "success" };
    if (prediction.confidence >= 0.6)
      return { label: "Medium", color: "warning" };
    return { label: "Low", color: "danger" };
  }, [prediction.confidence]);

  // Calculate time until prediction
  const timeUntil = useMemo(() => {
    const now = new Date();
    const predicted = new Date(prediction.predictedTimestamp);
    const diffMs = predicted.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }, [prediction.predictedTimestamp]);

  // Calculate prediction range
  const predictionRange = useMemo(() => {
    return prediction.upperBound - prediction.lowerBound;
  }, [prediction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Prediction Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {sensor?.name || `Sensor ${prediction.sensorId.slice(0, 8)}`}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Predicted Value
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {prediction.predictedValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {sensor?.lastReading?.unit || "units"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Confidence
            </p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(prediction.confidence * 100).toFixed(0)}%
              </p>
              <Badge variant={confidenceLevel.color as any} size="sm">
                {confidenceLevel.label}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Time Until
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {timeUntil}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {format(new Date(prediction.predictedTimestamp), "MMM d, HH:mm")}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Prediction Range
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ±{(predictionRange / 2).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {prediction.lowerBound.toFixed(1)} -{" "}
              {prediction.upperBound.toFixed(1)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Historical vs Predicted Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historical Data vs Prediction
          </h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="label"
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F3F4F6",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Confidence Interval Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prediction Confidence Interval
          </h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={[
                {
                  label: "Lower Bound",
                  value: prediction.lowerBound,
                },
                {
                  label: "Predicted",
                  value: prediction.predictedValue,
                },
                {
                  label: "Upper Bound",
                  value: prediction.upperBound,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="label"
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F3F4F6",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Confidence Interval:</strong> The prediction has a{" "}
              {(prediction.confidence * 100).toFixed(0)}% confidence that the
              actual value will fall between {prediction.lowerBound.toFixed(2)}{" "}
              and {prediction.upperBound.toFixed(2)}.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Model Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Model Information
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model Version
              </p>
              <p className="text-gray-900 dark:text-white">
                {prediction.modelVersion || "v1.0.0"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Generated At
              </p>
              <p className="text-gray-900 dark:text-white">
                {formatDistanceToNow(new Date(prediction.predictedTimestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sensor Type
              </p>
              <p className="text-gray-900 dark:text-white">
                {sensor?.type.replace("_", " ") || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prediction ID
              </p>
              <p className="text-gray-900 dark:text-white font-mono text-xs">
                {prediction.id.slice(0, 16)}...
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sensor Details */}
      {sensor && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sensor Details
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sensor Name
                </p>
                <p className="text-gray-900 dark:text-white">{sensor.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Status
                </p>
                <Badge
                  variant={
                    sensor.status === "online"
                      ? "success"
                      : sensor.status === "warning"
                      ? "warning"
                      : "danger"
                  }
                >
                  {sensor.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Value
                </p>
                <p className="text-gray-900 dark:text-white">
                  {sensor.currentValue?.toFixed(2) || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </p>
                <p className="text-gray-900 dark:text-white font-mono text-xs">
                  {sensor.location.coordinates[1].toFixed(4)},{" "}
                  {sensor.location.coordinates[0].toFixed(4)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
