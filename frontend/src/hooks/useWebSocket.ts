import { useEffect } from "react";
import { wsClient } from "@/lib/websocket";
import { useSensorStore } from "@/stores/sensorStore";
import { useIncidentStore } from "@/stores/incidentStore";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { useAgentStore } from "@/stores/agentStore";
import { useMetricsStore } from "@/stores/metricsStore";
import { useScenarioStore } from "@/stores/scenarioStore";

export function useWebSocket() {
  const { updateSensorReading } = useSensorStore();
  const { addIncident, updateIncident } = useIncidentStore();
  const { addWorkOrder, updateWorkOrder } = useWorkOrderStore();
  const { addMessage } = useAgentStore();
  const { setMetrics } = useMetricsStore();
  const { setActiveScenario } = useScenarioStore();

  useEffect(() => {
    // Sensor events
    const handleSensorReading = (data: any) => {
      updateSensorReading(data);
    };

    const handleSensorAnomaly = (data: any) => {
      console.log("Sensor anomaly detected:", data);
    };

    // Incident events
    const handleIncidentCreated = (data: any) => {
      addIncident(data);
    };

    const handleIncidentUpdated = (data: any) => {
      updateIncident(data.id, data);
    };

    const handleIncidentResolved = (data: any) => {
      updateIncident(data.incidentId, { status: "RESOLVED" });
    };

    // Work order events
    const handleWorkOrderCreated = (data: any) => {
      addWorkOrder(data);
    };

    const handleWorkOrderUpdated = (data: any) => {
      updateWorkOrder(data.id, data);
    };

    // Agent events
    const handleAgentMessage = (data: any) => {
      addMessage(data);
    };

    const handleAgentPlanCreated = (data: any) => {
      console.log("Agent plan created:", data);
    };

    const handleAgentDispatched = (data: any) => {
      console.log("Agent dispatched:", data);
    };

    const handleAgentExplained = (data: any) => {
      console.log("Agent explanation:", data);
    };

    // Metrics events
    const handleMetricsUpdate = (data: any) => {
      setMetrics(data);
    };

    // Scenario events
    const handleScenarioStarted = (data: any) => {
      console.log("Scenario started:", data);
      if (data.scenario) {
        setActiveScenario(data.scenario);
      }
    };

    const handleScenarioStopped = (data: any) => {
      console.log("Scenario stopped:", data);
      setActiveScenario(null);
    };

    // Register event handlers
    wsClient.on("sensor:reading", handleSensorReading);
    wsClient.on("sensor:anomaly", handleSensorAnomaly);
    wsClient.on("incident:created", handleIncidentCreated);
    wsClient.on("incident:updated", handleIncidentUpdated);
    wsClient.on("incident:resolved", handleIncidentResolved);
    wsClient.on("workorder:created", handleWorkOrderCreated);
    wsClient.on("workorder:updated", handleWorkOrderUpdated);
    wsClient.on("agent:message", handleAgentMessage);
    wsClient.on("agent:plan_created", handleAgentPlanCreated);
    wsClient.on("agent:dispatched", handleAgentDispatched);
    wsClient.on("agent:explained", handleAgentExplained);
    wsClient.on("metrics:update", handleMetricsUpdate);
    wsClient.on("scenario:started", handleScenarioStarted);
    wsClient.on("scenario:stopped", handleScenarioStopped);

    // Cleanup
    return () => {
      wsClient.off("sensor:reading", handleSensorReading);
      wsClient.off("sensor:anomaly", handleSensorAnomaly);
      wsClient.off("incident:created", handleIncidentCreated);
      wsClient.off("incident:updated", handleIncidentUpdated);
      wsClient.off("incident:resolved", handleIncidentResolved);
      wsClient.off("workorder:created", handleWorkOrderCreated);
      wsClient.off("workorder:updated", handleWorkOrderUpdated);
      wsClient.off("agent:message", handleAgentMessage);
      wsClient.off("agent:plan_created", handleAgentPlanCreated);
      wsClient.off("agent:dispatched", handleAgentDispatched);
      wsClient.off("agent:explained", handleAgentExplained);
      wsClient.off("metrics:update", handleMetricsUpdate);
      wsClient.off("scenario:started", handleScenarioStarted);
      wsClient.off("scenario:stopped", handleScenarioStopped);
    };
  }, [
    updateSensorReading,
    addIncident,
    updateIncident,
    addWorkOrder,
    updateWorkOrder,
    addMessage,
    setMetrics,
    setActiveScenario,
  ]);

  return {
    isConnected: wsClient.isConnected(),
    emit: wsClient.emit.bind(wsClient),
  };
}
