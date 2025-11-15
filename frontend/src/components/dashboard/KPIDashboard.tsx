import { useMemo } from "react";
import { MetricCard, TrendDirection } from "./MetricCard";
import { AlertTriangle, TrendingUp, Briefcase, Shield } from "lucide-react";
import { SystemMetrics } from "@/types";

export interface KPIDashboardProps {
  metrics: SystemMetrics | null;
  metricsHistory?: SystemMetrics[];
  loading?: boolean;
}

export function KPIDashboard({
  metrics,
  metricsHistory = [],
  loading = false,
}: KPIDashboardProps) {
  // Calculate trends from history
  const trends = useMemo(() => {
    if (metricsHistory.length < 2) {
      return {
        incidents: { direction: "stable" as TrendDirection, value: 0 },
        predictions: { direction: "stable" as TrendDirection, value: 0 },
        workOrders: { direction: "stable" as TrendDirection, value: 0 },
        riskLevel: { direction: "stable" as TrendDirection, value: 0 },
      };
    }

    const current = metricsHistory[metricsHistory.length - 1];
    const previous = metricsHistory[metricsHistory.length - 2];

    const calculateTrend = (
      currentVal: number,
      previousVal: number
    ): { direction: TrendDirection; value: number } => {
      if (previousVal === 0) {
        return { direction: "stable", value: 0 };
      }
      const change = ((currentVal - previousVal) / previousVal) * 100;
      const direction =
        Math.abs(change) < 1 ? "stable" : change > 0 ? "up" : "down";
      return { direction, value: Math.round(change) };
    };

    return {
      incidents: calculateTrend(
        current.activeIncidents,
        previous.activeIncidents
      ),
      predictions: calculateTrend(
        current.activePredictions,
        previous.activePredictions
      ),
      workOrders: calculateTrend(
        current.activeWorkOrders,
        previous.activeWorkOrders
      ),
      riskLevel: calculateTrend(
        current.overallRiskLevel,
        previous.overallRiskLevel
      ),
    };
  }, [metricsHistory]);

  // Extract sparkline data
  const sparklineData = useMemo(() => {
    const limit = 20;
    const recent = metricsHistory.slice(-limit);

    return {
      incidents: recent.map((m) => m.activeIncidents),
      predictions: recent.map((m) => m.activePredictions),
      workOrders: recent.map((m) => m.activeWorkOrders),
      riskLevel: recent.map((m) => m.overallRiskLevel),
    };
  }, [metricsHistory]);

  // Determine color scheme based on values
  const getRiskColorScheme = (
    riskLevel: number
  ): "success" | "warning" | "danger" => {
    if (riskLevel >= 70) return "danger";
    if (riskLevel >= 40) return "warning";
    return "success";
  };

  const getIncidentColorScheme = (
    criticalCount: number
  ): "default" | "warning" | "danger" => {
    if (criticalCount >= 5) return "danger";
    if (criticalCount >= 2) return "warning";
    return "default";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        label="Active Incidents"
        value={metrics?.activeIncidents ?? 0}
        trend={trends.incidents.direction}
        trendValue={trends.incidents.value}
        sparklineData={sparklineData.incidents}
        colorScheme={
          metrics
            ? getIncidentColorScheme(metrics.criticalIncidents)
            : "default"
        }
        icon={<AlertTriangle className="w-6 h-6" />}
        loading={loading}
      />

      <MetricCard
        label="Active Predictions"
        value={metrics?.activePredictions ?? 0}
        trend={trends.predictions.direction}
        trendValue={trends.predictions.value}
        sparklineData={sparklineData.predictions}
        colorScheme="default"
        icon={<TrendingUp className="w-6 h-6" />}
        loading={loading}
      />

      <MetricCard
        label="Work Orders"
        value={metrics?.activeWorkOrders ?? 0}
        trend={trends.workOrders.direction}
        trendValue={trends.workOrders.value}
        sparklineData={sparklineData.workOrders}
        colorScheme="default"
        icon={<Briefcase className="w-6 h-6" />}
        loading={loading}
      />

      <MetricCard
        label="Risk Level"
        value={metrics?.overallRiskLevel ?? 0}
        unit="/100"
        trend={trends.riskLevel.direction}
        trendValue={trends.riskLevel.value}
        sparklineData={sparklineData.riskLevel}
        colorScheme={
          metrics ? getRiskColorScheme(metrics.overallRiskLevel) : "success"
        }
        icon={<Shield className="w-6 h-6" />}
        loading={loading}
      />
    </div>
  );
}
