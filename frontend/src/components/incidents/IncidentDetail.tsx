import { useState, useEffect } from "react";
import { Incident, SensorReading, Prediction, WorkOrder } from "@/types";
import {
  SeverityBadge,
  StatusBadge,
  Button,
  Card,
  Skeleton,
} from "@/components/ui";
import { ScoringBreakdown } from "./ScoringBreakdown";
import { ExplanationCard } from "./ExplanationCard";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";

interface IncidentDetailProps {
  incident: Incident;
  onDismiss?: (id: string) => void;
  onCreateWorkOrder?: (id: string) => void;
  onViewOnMap?: (id: string) => void;
}

export function IncidentDetail({
  incident,
  onDismiss,
  onCreateWorkOrder,
  onViewOnMap,
}: IncidentDetailProps) {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedData = async () => {
      setLoading(true);
      try {
        // Fetch sensor readings if sensor ID exists
        if (incident.sensorId) {
          const sensorResponse = await apiClient.sensors.getReadings(
            incident.sensorId,
            { limit: 10 }
          );
          setSensorData(sensorResponse.data);

          // Fetch predictions for the sensor
          const predictionResponse = await apiClient.predictions.getBySensor(
            incident.sensorId
          );
          setPredictions(predictionResponse.data);
        }

        // Fetch work orders for this incident
        const workOrderResponse = await apiClient.workOrders.getAll({
          incidentId: incident.id,
        });
        setWorkOrders(workOrderResponse.data);
      } catch (error) {
        console.error("Error fetching related data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedData();
  }, [incident.id, incident.sensorId]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(incident.id);
    }
  };

  const handleCreateWorkOrder = () => {
    if (onCreateWorkOrder) {
      onCreateWorkOrder(incident.id);
    }
  };

  const handleViewOnMap = () => {
    if (onViewOnMap) {
      onViewOnMap(incident.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {incident.type.replace(/_/g, " ")}
            </h2>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Priority Score
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {incident.priorityScore}
            </div>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {incident.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Detected:
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {format(new Date(incident.detectedAt), "PPpp")}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Confidence:
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {(incident.confidence * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Category:
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {incident.category.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zone ID:
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {incident.zoneId.substring(0, 8)}...
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleViewOnMap} variant="primary">
            View on Map
          </Button>
          {incident.status === "ACTIVE" && (
            <>
              <Button onClick={handleCreateWorkOrder} variant="secondary">
                Create Work Order
              </Button>
              <Button onClick={handleDismiss} variant="ghost">
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scoring Breakdown */}
      {incident.scoringBreakdown && (
        <ScoringBreakdown
          scoringBreakdown={incident.scoringBreakdown}
          totalScore={incident.priorityScore}
        />
      )}

      {/* AI Explanation */}
      {incident.explanation && (
        <ExplanationCard explanation={incident.explanation} />
      )}

      {/* Sensor Data */}
      {incident.sensorId && (
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Associated Sensor Data
            </h3>
          </div>
          <div className="p-4">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : sensorData.length > 0 ? (
              <div className="space-y-2">
                {sensorData.map((reading) => (
                  <div
                    key={reading.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(reading.timestamp), "PPpp")}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {reading.value} {reading.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sensor data available
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Predictions */}
      {predictions.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Predictions
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                >
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(prediction.predictedTimestamp), "PPpp")}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Confidence: {(prediction.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {prediction.predictedValue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Work Orders */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Linked Work Orders
          </h3>
        </div>
        <div className="p-4">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : workOrders.length > 0 ? (
            <div className="space-y-3">
              {workOrders.map((workOrder) => (
                <div
                  key={workOrder.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {workOrder.title}
                    </h4>
                    <StatusBadge status={workOrder.status} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {workOrder.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>
                      {workOrder.assignedUnitId
                        ? `Assigned to: ${workOrder.assignedUnitId}`
                        : "Unassigned"}
                    </span>
                    <span>
                      Est. Duration: {workOrder.estimatedDuration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No work orders created yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
