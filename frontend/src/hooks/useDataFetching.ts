import { useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useSensorStore } from "@/stores/sensorStore";
import { useIncidentStore } from "@/stores/incidentStore";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { usePredictionStore } from "@/stores/predictionStore";
import { useMetricsStore } from "@/stores/metricsStore";

export function useDataFetching() {
  const {
    setSensors,
    setLoading: setSensorLoading,
    setError: setSensorError,
  } = useSensorStore();
  const {
    setIncidents,
    setLoading: setIncidentLoading,
    setError: setIncidentError,
  } = useIncidentStore();
  const {
    setWorkOrders,
    setLoading: setWorkOrderLoading,
    setError: setWorkOrderError,
  } = useWorkOrderStore();
  const {
    setPredictions,
    setLoading: setPredictionLoading,
    setError: setPredictionError,
  } = usePredictionStore();
  const { setMetrics, setError: setMetricsError } = useMetricsStore();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch sensors
        setSensorLoading(true);
        const sensorsResponse = await apiClient.sensors.getAll();
        setSensors(sensorsResponse.data);
        setSensorLoading(false);
      } catch (error: any) {
        console.error("Error fetching sensors:", error);
        setSensorError(error.message);
        setSensorLoading(false);
      }

      try {
        // Fetch incidents
        setIncidentLoading(true);
        const incidentsResponse = await apiClient.incidents.getAll();
        setIncidents(incidentsResponse.data);
        setIncidentLoading(false);
      } catch (error: any) {
        console.error("Error fetching incidents:", error);
        setIncidentError(error.message);
        setIncidentLoading(false);
      }

      try {
        // Fetch work orders
        setWorkOrderLoading(true);
        const workOrdersResponse = await apiClient.workOrders.getAll();
        // Backend returns { workOrders: [...], count: ... }
        setWorkOrders(workOrdersResponse.data.workOrders || []);
        setWorkOrderLoading(false);
      } catch (error: any) {
        console.error("Error fetching work orders:", error);
        setWorkOrderError(error.message);
        setWorkOrderLoading(false);
      }

      try {
        // Fetch predictions
        setPredictionLoading(true);
        const predictionsResponse = await apiClient.predictions.getAll();
        setPredictions(predictionsResponse.data);
        setPredictionLoading(false);
      } catch (error: any) {
        console.error("Error fetching predictions:", error);
        setPredictionError(error.message);
        setPredictionLoading(false);
      }
    };

    fetchInitialData();
  }, [
    setSensors,
    setSensorLoading,
    setSensorError,
    setIncidents,
    setIncidentLoading,
    setIncidentError,
    setWorkOrders,
    setWorkOrderLoading,
    setWorkOrderError,
    setPredictions,
    setPredictionLoading,
    setPredictionError,
  ]);

  // Fetch metrics periodically
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Calculate metrics from current state
        const incidents = useIncidentStore.getState().incidents;
        const workOrders = useWorkOrderStore.getState().workOrders;
        const predictions = usePredictionStore.getState().predictions;

        // Safety checks for arrays
        const incidentsArray = Array.isArray(incidents) ? incidents : [];
        const workOrdersArray = Array.isArray(workOrders) ? workOrders : [];
        const predictionsArray = Array.isArray(predictions) ? predictions : [];

        const metrics = {
          activeIncidents: incidentsArray.filter((i) => i.status === "ACTIVE")
            .length,
          criticalIncidents: incidentsArray.filter(
            (i) => i.severity === "CRITICAL" && i.status === "ACTIVE"
          ).length,
          activePredictions: predictionsArray.length,
          activeWorkOrders: workOrdersArray.filter((wo) =>
            ["CREATED", "ASSIGNED", "IN_PROGRESS"].includes(wo.status)
          ).length,
          overallRiskLevel: calculateRiskLevel(incidentsArray),
          zoneStatus: {
            healthy: 0,
            warning: 0,
            critical: 0,
          },
        };

        setMetrics(metrics);
      } catch (error: any) {
        console.error("Error calculating metrics:", error);
        setMetricsError(error.message);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [setMetrics, setMetricsError]);
}

function calculateRiskLevel(incidents: any[]): number {
  if (!Array.isArray(incidents) || incidents.length === 0) return 0;

  const activeIncidents = incidents.filter((i) => i.status === "ACTIVE");
  if (activeIncidents.length === 0) return 0;

  const avgPriority =
    activeIncidents.reduce((sum, i) => sum + i.priorityScore, 0) /
    activeIncidents.length;

  return Math.min(100, Math.round(avgPriority));
}
