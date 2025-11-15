import { useEffect } from "react";
import { wsClient } from "@/lib/websocket";
import { useSensorStore } from "@/stores/sensorStore";
import { useIncidentStore } from "@/stores/incidentStore";
import { useWorkOrderStore } from "@/stores/workOrderStore";
import { useAgentStore } from "@/stores/agentStore";
import { useMetricsStore } from "@/stores/metricsStore";

export function useWebSocket() {
  const { updateSensorReading } = useSensorStore();
  const { addIncident, updateIncident } = useIncidentStore();
  const { addWorkOrder, updateWorkOrder } = useWorkOrderStore();
  const { addMessage } = useAgentStore();
  const { setMetrics } = useMetricsStore();

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
    };
  }, [
    updateSensorReading,
    addIncident,
    updateIncident,
    addWorkOrder,
    updateWorkOrder,
    addMessage,
    setMetrics,
  ]);

  return {
    isConnected: wsClient.isConnected(),
    emit: wsClient.emit.bind(wsClient),
  };
}
