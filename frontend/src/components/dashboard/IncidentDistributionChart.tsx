import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Incident, IncidentCategory } from "@/types";

export interface IncidentDistributionChartProps {
  incidents: Incident[];
  title?: string;
  height?: number;
}

const categoryColors: Record<IncidentCategory, string> = {
  WASTE_OVERFLOW: "#ef4444",
  LIGHTING_FAILURE: "#f59e0b",
  WATER_ANOMALY: "#3b82f6",
  TRAFFIC_CONGESTION: "#8b5cf6",
  ENVIRONMENTAL_HAZARD: "#10b981",
  NOISE_COMPLAINT: "#6366f1",
};

const categoryLabels: Record<IncidentCategory, string> = {
  WASTE_OVERFLOW: "Waste",
  LIGHTING_FAILURE: "Lighting",
  WATER_ANOMALY: "Water",
  TRAFFIC_CONGESTION: "Traffic",
  ENVIRONMENTAL_HAZARD: "Environment",
  NOISE_COMPLAINT: "Noise",
};

export function IncidentDistributionChart({
  incidents,
  title = "Incident Distribution by Type",
  height = 300,
}: IncidentDistributionChartProps) {
  const chartData = useMemo(() => {
    const distribution: Record<IncidentCategory, number> = {
      WASTE_OVERFLOW: 0,
      LIGHTING_FAILURE: 0,
      WATER_ANOMALY: 0,
      TRAFFIC_CONGESTION: 0,
      ENVIRONMENTAL_HAZARD: 0,
      NOISE_COMPLAINT: 0,
    };

    incidents.forEach((incident) => {
      if (incident.category in distribution) {
        distribution[incident.category]++;
      }
    });

    return Object.entries(distribution).map(([category, count]) => ({
      category: categoryLabels[category as IncidentCategory],
      count,
      fullCategory: category as IncidentCategory,
    }));
  }, [incidents]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.category}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count:{" "}
            <span className="font-semibold" style={{ color: payload[0].fill }}>
              {data.count}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalIncidents = useMemo(
    () => chartData.reduce((sum, item) => sum + item.count, 0),
    [chartData]
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total: {totalIncidents}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="category"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => (
              <span className="text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          <Bar dataKey="count" name="Incidents" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={categoryColors[entry.fullCategory]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
