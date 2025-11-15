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
import { useChartTheme } from "@/hooks";

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
  const { colors, axis, grid, tooltip } = useChartTheme();

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
        <div
          className="p-3 rounded-lg shadow-lg border"
          style={{
            backgroundColor: tooltip.background,
            borderColor: tooltip.border,
          }}
        >
          <p className="text-sm font-medium" style={{ color: tooltip.text }}>
            {format(new Date(data.timestamp), "MMM dd, HH:mm:ss")}
          </p>
          <p className="text-sm" style={{ color: tooltip.label }}>
            Value:{" "}
            <span
              className="font-semibold"
              style={{ color: colors.charts.info }}
            >
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
          <CartesianGrid {...grid} opacity={0.1} />
          <XAxis
            dataKey="formattedTime"
            stroke={axis.stroke}
            style={{ fontSize: "12px" }}
            tick={{ fill: axis.tick }}
          />
          <YAxis
            stroke={axis.stroke}
            style={{ fontSize: "12px" }}
            tick={{ fill: axis.tick }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px", color: axis.label }}
              iconType="line"
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors.charts.info}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: colors.charts.info }}
            name="Sensor Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
