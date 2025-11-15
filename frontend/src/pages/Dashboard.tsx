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
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time overview of city operations and infrastructure health
        </p>
      </div>

      {/* KPI Cards */}
      <KPIDashboard metrics={metrics} metricsHistory={history} />

      {/* System Metrics */}
      <SystemMetrics metrics={metrics} incidents={incidents} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentDistributionChart incidents={incidents} />
        <SensorTimeSeriesChart
          readings={sampleSensorReadings}
          title="Recent Sensor Activity"
        />
      </div>

      {/* Prediction Chart */}
      {samplePredictions.length > 0 && (
        <PredictionConfidenceChart
          predictions={samplePredictions}
          title="Predictive Analytics"
        />
      )}
    </div>
  );
}
