import { useMetricsStore } from "@/stores/metricsStore";
import { useIncidentStore } from "@/stores/incidentStore";
import { useSensorStore } from "@/stores/sensorStore";
import { usePredictionStore } from "@/stores/predictionStore";
import {
  KPIDashboard,
  SystemMetrics,
  SensorTimeSeriesChart,
  IncidentDistributionChart,
  PredictionConfidenceChart,
} from "@/components/dashboard";
import {
  DashboardLayout,
  DashboardHeader,
  DashboardGrid,
} from "@/components/layout";

export function Dashboard() {
  const { metrics, history } = useMetricsStore();
  const { incidents } = useIncidentStore();
  const { sensors } = useSensorStore();
  const { predictions } = usePredictionStore();

  // Get sample sensor readings for chart (first sensor with readings)
  const sampleSensorReadings =
    sensors.length > 0 && sensors[0].lastReading
      ? [sensors[0].lastReading]
      : [];

  // Get sample predictions for chart (first 10)
  const samplePredictions = predictions.slice(0, 10);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Dashboard"
        description="Real-time overview of city operations and infrastructure health"
      />

      {/* KPI Cards - Responsive grid */}
      <KPIDashboard metrics={metrics} metricsHistory={history} />

      {/* System Metrics */}
      <SystemMetrics metrics={metrics} incidents={incidents} />

      {/* Charts Grid - Responsive breakpoints */}
      <DashboardGrid columns={2}>
        <IncidentDistributionChart incidents={incidents} />
        <SensorTimeSeriesChart
          readings={sampleSensorReadings}
          title="Recent Sensor Activity"
        />
      </DashboardGrid>

      {/* Prediction Chart - Full width */}
      {samplePredictions.length > 0 && (
        <PredictionConfidenceChart
          predictions={samplePredictions}
          title="Predictive Analytics"
        />
      )}
    </DashboardLayout>
  );
}
