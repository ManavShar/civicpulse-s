import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { SystemMetrics as SystemMetricsType, Incident } from "@/types";
import { AlertCircle, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export interface SystemMetricsProps {
  metrics: SystemMetricsType | null;
  incidents?: Incident[];
  loading?: boolean;
}

interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function SystemMetrics({
  metrics,
  incidents = [],
  loading = false,
}: SystemMetricsProps) {
  // Calculate severity breakdown from incidents
  const severityBreakdown = useMemo<SeverityBreakdown>(() => {
    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    incidents.forEach((incident) => {
      const severity =
        incident.severity.toLowerCase() as keyof SeverityBreakdown;
      if (severity in breakdown) {
        breakdown[severity]++;
      }
    });

    return breakdown;
  }, [incidents]);

  const totalIncidents = useMemo(
    () => Object.values(severityBreakdown).reduce((sum, val) => sum + val, 0),
    [severityBreakdown]
  );

  const zoneStatusData = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        label: "Healthy",
        count: metrics.zoneStatus.healthy,
        color: "bg-green-500",
        icon: CheckCircle,
        textColor: "text-green-600 dark:text-green-400",
      },
      {
        label: "Warning",
        count: metrics.zoneStatus.warning,
        color: "bg-yellow-500",
        icon: AlertTriangle,
        textColor: "text-yellow-600 dark:text-yellow-400",
      },
      {
        label: "Critical",
        count: metrics.zoneStatus.critical,
        color: "bg-red-500",
        icon: AlertCircle,
        textColor: "text-red-600 dark:text-red-400",
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </Card>
        <Card className="p-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Severity Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Incident Severity Breakdown
        </h3>

        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="space-y-3">
            <SeverityBar
              label="Critical"
              count={severityBreakdown.critical}
              total={totalIncidents}
              color="bg-red-500"
              textColor="text-red-600 dark:text-red-400"
            />
            <SeverityBar
              label="High"
              count={severityBreakdown.high}
              total={totalIncidents}
              color="bg-orange-500"
              textColor="text-orange-600 dark:text-orange-400"
            />
            <SeverityBar
              label="Medium"
              count={severityBreakdown.medium}
              total={totalIncidents}
              color="bg-yellow-500"
              textColor="text-yellow-600 dark:text-yellow-400"
            />
            <SeverityBar
              label="Low"
              count={severityBreakdown.low}
              total={totalIncidents}
              color="bg-blue-500"
              textColor="text-blue-600 dark:text-blue-400"
            />
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Active Incidents
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalIncidents}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone Status Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Zone Status Summary
        </h3>

        <div className="space-y-4">
          {zoneStatusData.map((status, index) => (
            <motion.div
              key={status.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${status.color}/10`}>
                  <status.icon className={`w-5 h-5 ${status.textColor}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {status.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {status.count} zone{status.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <motion.span
                  key={status.count}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-bold ${status.textColor}`}
                >
                  {status.count}
                </motion.span>
              </div>
            </motion.div>
          ))}

          {/* Total Zones */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Zones Monitored
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics
                  ? metrics.zoneStatus.healthy +
                    metrics.zoneStatus.warning +
                    metrics.zoneStatus.critical
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface SeverityBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}

function SeverityBar({
  label,
  count,
  total,
  color,
  textColor,
}: SeverityBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className={`text-sm font-semibold ${textColor}`}>{count}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
