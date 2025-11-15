import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "./Sparkline";

export type TrendDirection = "up" | "down" | "stable";

export interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: TrendDirection;
  trendValue?: number;
  sparklineData?: number[];
  colorScheme?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  loading?: boolean;
}

const colorSchemes = {
  default: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  stable: "text-gray-600 dark:text-gray-400",
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  sparklineData,
  colorScheme = "default",
  icon,
  loading = false,
}: MetricCardProps) {
  const colors = colorSchemes[colorScheme];
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <motion.div
              key={value}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {unit && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {unit}
                </span>
              )}
            </motion.div>
          )}
        </div>
        {icon && (
          <div
            className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}
          >
            <div className={colors.text}>{icon}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trend && TrendIcon && (
            <div className="flex items-center gap-1">
              <TrendIcon className={`w-4 h-4 ${trendColors[trend]}`} />
              {trendValue !== undefined && (
                <span className={`text-sm font-medium ${trendColors[trend]}`}>
                  {trendValue > 0 ? "+" : ""}
                  {trendValue}%
                </span>
              )}
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-8">
            <Sparkline data={sparklineData} color={colors.text} />
          </div>
        )}
      </div>
    </Card>
  );
}
