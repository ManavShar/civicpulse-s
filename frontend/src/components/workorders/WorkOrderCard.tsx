import { WorkOrder } from "@/types";
import { PriorityBadge, StatusBadge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

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

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function WorkOrderCard({
  workOrder,
  onSelect,
  isSelected = false,
}: WorkOrderCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(workOrder.id);
    }
  };

  // Calculate progress percentage for in-progress work orders
  const getProgressPercentage = (): number => {
    if (workOrder.status === "COMPLETED") return 100;
    if (workOrder.status === "CANCELLED") return 0;
    if (!workOrder.startedAt || !workOrder.estimatedCompletion) return 0;

    const start = new Date(workOrder.startedAt).getTime();
    const end = new Date(workOrder.estimatedCompletion).getTime();
    const now = Date.now();

    if (now >= end) return 100;
    if (now <= start) return 0;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  const progress = getProgressPercentage();
  const showProgress = workOrder.status === "IN_PROGRESS";

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 border rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      {/* Header with badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={workOrder.priority} />
          <StatusBadge status={workOrder.status} />
        </div>
        {workOrder.status === "COMPLETED" && (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {workOrder.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {workOrder.description}
      </p>

      {/* Progress bar for in-progress work orders */}
      {showProgress && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2">
        {/* Assigned Unit */}
        {workOrder.assignedUnitId && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserIcon className="w-4 h-4" />
            <span>Unit: {workOrder.assignedUnitId}</span>
          </div>
        )}

        {/* Location */}
        {workOrder.location?.coordinates &&
          Array.isArray(workOrder.location.coordinates) &&
          workOrder.location.coordinates.length >= 2 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4" />
              <span>
                {workOrder.location.coordinates[1].toFixed(4)},{" "}
                {workOrder.location.coordinates[0].toFixed(4)}
              </span>
            </div>
          )}

        {/* Estimated Completion */}
        {workOrder.estimatedCompletion && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-4 h-4" />
            <span>
              {workOrder.status === "COMPLETED"
                ? "Completed"
                : "Est. completion"}{" "}
              {formatDistanceToNow(new Date(workOrder.estimatedCompletion), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Duration badge */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          Duration: {workOrder.estimatedDuration} minutes
        </span>
      </div>
    </div>
  );
}
