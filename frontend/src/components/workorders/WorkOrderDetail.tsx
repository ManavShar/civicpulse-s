import { useEffect, useState } from "react";
import { WorkOrder, Incident } from "@/types";
import {
  PriorityBadge,
  StatusBadge,
  Card,
  CardHeader,
  CardBody,
  Button,
} from "@/components/ui";
import { apiClient } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";

// Icon components
const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onClose?: () => void;
}

export function WorkOrderDetail({ workOrder, onClose }: WorkOrderDetailProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    // Fetch related incident
    const fetchIncident = async () => {
      if (!workOrder.incidentId) return;

      setLoading(true);
      try {
        const response = await apiClient.incidents.getById(
          workOrder.incidentId
        );
        setIncident(response.data);

        // Extract explanation if available
        if (response.data.explanation) {
          setExplanation(response.data.explanation.explanation);
        }
      } catch (error) {
        console.error("Failed to fetch incident:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [workOrder.incidentId]);

  // Calculate timeline events
  const timelineEvents = [
    {
      label: "Created",
      timestamp: workOrder.metadata?.createdAt || new Date(),
      icon: DocumentTextIcon,
      color: "text-blue-500",
    },
    workOrder.startedAt && {
      label: "Started",
      timestamp: workOrder.startedAt,
      icon: ArrowPathIcon,
      color: "text-yellow-500",
    },
    workOrder.completedAt && {
      label: "Completed",
      timestamp: workOrder.completedAt,
      icon: CheckCircleIcon,
      color: "text-green-500",
    },
    workOrder.status === "CANCELLED" && {
      label: "Cancelled",
      timestamp: new Date(),
      icon: XCircleIcon,
      color: "text-red-500",
    },
  ].filter(Boolean) as Array<{
    label: string;
    timestamp: Date;
    icon: any;
    color: string;
  }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {workOrder.title}
          </h2>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={workOrder.priority} />
            <StatusBadge status={workOrder.status} />
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <XCircleIcon className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Description
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-700 dark:text-gray-300">
            {workOrder.description}
          </p>
        </CardBody>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assigned Unit */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Assigned Unit
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {workOrder.assignedUnitId || "Unassigned"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Location */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MapPinIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Location
                </p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {workOrder.location.coordinates[1].toFixed(4)},{" "}
                  {workOrder.location.coordinates[0].toFixed(4)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Duration */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estimated Duration
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {workOrder.estimatedDuration} minutes
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Completion Time */}
        {workOrder.estimatedCompletion && (
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {workOrder.status === "COMPLETED"
                      ? "Completed"
                      : "Est. Completion"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDistanceToNow(
                      new Date(workOrder.estimatedCompletion),
                      {
                        addSuffix: true,
                      }
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Timeline
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-full ${event.color} bg-opacity-10`}
                  >
                    <Icon className={`w-5 h-5 ${event.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(event.timestamp), "PPpp")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Linked Incident */}
      {incident && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Linked Incident
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={incident.status} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Priority Score: {incident.priorityScore}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {incident.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detected{" "}
                {formatDistanceToNow(new Date(incident.detectedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Explanation */}
      {explanation && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Why This Work Order Was Created
            </h3>
          </CardHeader>
          <CardBody>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {explanation}
            </p>
          </CardBody>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}
