import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { SensorReading } from "@/types";
import { format } from "date-fns";

export interface SensorTimeSeriesChartProps {
  readings: SensorReading[];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export function SensorTimeSeriesChart({
  readings,
  title = "Sensor Data Over Time",
  height = 300,
  showLegend = true,
}: SensorTimeSeriesChartProps) {
  const chartData = useMemo(() => {
    return readings.map((reading) => ({
      timestamp: new Date(reading.timestamp).getTime(),
      value: reading.value,
      formattedTime: format(new Date(reading.timestamp), "HH:mm"),
    }));
  }, [readings]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {format(new Date(data.timestamp), "MMM dd, HH:mm:ss")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {data.value.toFixed(2)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (readings.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
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
        <LineChart data={chartData}>
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
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              iconType="line"
              formatter={(value) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#3b82f6" }}
            name="Sensor Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
