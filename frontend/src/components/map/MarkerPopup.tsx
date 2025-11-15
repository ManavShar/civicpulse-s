import { Sensor, Incident, WorkOrder } from "@/types";
import { format, formatDistanceToNow } from "date-fns";

interface SensorPopupProps {
  sensor: Sensor;
  onClose: () => void;
}

export function SensorPopup({ sensor, onClose }: SensorPopupProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[250px]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {sensor.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sensor.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              sensor.status === "online"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : sensor.status === "warning"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            {sensor.status}
          </span>
        </div>

        {sensor.currentValue !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Value:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {sensor.currentValue.toFixed(2)}
              {sensor.lastReading?.unit && ` ${sensor.lastReading.unit}`}
            </span>
          </div>
        )}

        {sensor.lastReading && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last Reading:
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(sensor.lastReading.timestamp), "MMM d, HH:mm")}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Zone: {sensor.zoneId}
          </p>
        </div>
      </div>
    </div>
  );
}

interface IncidentPopupProps {
  incident: Incident;
  onClose: () => void;
  onViewDetails?: () => void;
}

export function IncidentPopup({
  incident,
  onClose,
  onViewDetails,
}: IncidentPopupProps) {
  const severityColors = {
    LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    MEDIUM:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[280px]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                severityColors[incident.severity]
              }`}
            >
              {incident.severity}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Priority: {incident.priorityScore}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {incident.category.replace(/_/g, " ")}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {incident.description}
        </p>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {(incident.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Detected:</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(incident.detectedAt), "MMM d, HH:mm")}
          </span>
        </div>

        {incident.scoringBreakdown && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scoring Breakdown:
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                Severity:
              </span>
              <span className="text-gray-900 dark:text-white">
                {incident.scoringBreakdown.severity}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Urgency:</span>
              <span className="text-gray-900 dark:text-white">
                {incident.scoringBreakdown.urgency}
              </span>
              <span className="text-gray-600 dark:text-gray-400">Impact:</span>
              <span className="text-gray-900 dark:text-white">
                {incident.scoringBreakdown.publicImpact}
              </span>
            </div>
          </div>
        )}

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}

interface WorkOrderPopupProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onViewDetails?: () => void;
}

export function WorkOrderPopup({
  workOrder,
  onClose,
  onViewDetails,
}: WorkOrderPopupProps) {
  const statusColors = {
    CREATED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_PROGRESS:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    COMPLETED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[280px]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                statusColors[workOrder.status]
              }`}
            >
              {workOrder.status.replace("_", " ")}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                priorityColors[workOrder.priority]
              }`}
            >
              {workOrder.priority}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {workOrder.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {workOrder.description}
        </p>

        {workOrder.assignedUnitId && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Assigned Unit:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {workOrder.assignedUnitId}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {workOrder.estimatedDuration} min
          </span>
        </div>

        {workOrder.estimatedCompletion && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {workOrder.status === "COMPLETED"
                ? "Completed:"
                : "Est. Completion:"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(workOrder.estimatedCompletion), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}

        {workOrder.startedAt && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="text-gray-500 dark:text-gray-400">
                {format(new Date(workOrder.startedAt), "MMM d, HH:mm")}
              </span>
            </div>
          </div>
        )}

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
