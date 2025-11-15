import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Prediction } from "@/types";
import { format } from "date-fns";

export interface PredictionConfidenceChartProps {
  predictions: Prediction[];
  historicalValues?: Array<{ timestamp: Date; value: number }>;
  title?: string;
  height?: number;
}

export function PredictionConfidenceChart({
  predictions,
  historicalValues = [],
  title = "Prediction with Confidence Intervals",
  height = 300,
}: PredictionConfidenceChartProps) {
  const chartData = useMemo(() => {
    // Combine historical and predicted data
    const historical = historicalValues.map((item) => ({
      timestamp: new Date(item.timestamp).getTime(),
      formattedTime: format(new Date(item.timestamp), "HH:mm"),
      actual: item.value,
      predicted: null,
      lowerBound: null,
      upperBound: null,
      type: "historical",
    }));

    const predicted = predictions.map((pred) => ({
      timestamp: new Date(pred.predictedTimestamp).getTime(),
      formattedTime: format(new Date(pred.predictedTimestamp), "HH:mm"),
      actual: null,
      predicted: pred.predictedValue,
      lowerBound: pred.lowerBound,
      upperBound: pred.upperBound,
      type: "predicted",
    }));

    return [...historical, ...predicted].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [predictions, historicalValues]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {format(new Date(data.timestamp), "MMM dd, HH:mm")}
          </p>
          {data.actual !== null && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actual:{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {data.actual.toFixed(2)}
              </span>
            </p>
          )}
          {data.predicted !== null && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predicted:{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {data.predicted.toFixed(2)}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Range:{" "}
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  {data.lowerBound.toFixed(2)} - {data.upperBound.toFixed(2)}
                </span>
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (predictions.length === 0 && historicalValues.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No prediction data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="formattedTime"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => (
              <span className="text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />

          {/* Confidence interval area */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="none"
            fill="url(#confidenceGradient)"
            name="Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="none"
            fill="#ffffff"
            name=""
          />

          {/* Actual values line */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="none"
            dot={false}
            activeDot={{ r: 6, fill: "#3b82f6" }}
            name="Actual"
            connectNulls={false}
          />

          {/* Predicted values line */}
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
            dot={false}
            activeDot={{ r: 6, fill: "#8b5cf6" }}
            name="Predicted"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
