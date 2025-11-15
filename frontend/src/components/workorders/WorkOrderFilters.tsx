import { useState } from "react";
import { WorkOrderStatus, Priority } from "@/types";
import { Button } from "@/components/ui";

// Icon components
const FunnelIcon = ({ className }: { className?: string }) => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

interface WorkOrderFiltersProps {
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function WorkOrderFilters({
  onFilterChange,
  onClearFilters,
}: WorkOrderFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<Priority[]>([]);

  const statusOptions: WorkOrderStatus[] = [
    "CREATED",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];

  const priorityOptions: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const handleStatusChange = (status: WorkOrderStatus) => {
    const newStatus = selectedStatus.includes(status)
      ? selectedStatus.filter((s) => s !== status)
      : [...selectedStatus, status];

    setSelectedStatus(newStatus);
    onFilterChange({
      status: newStatus.length > 0 ? newStatus : undefined,
    });
  };

  const handlePriorityChange = (priority: Priority) => {
    const newPriority = selectedPriority.includes(priority)
      ? selectedPriority.filter((p) => p !== priority)
      : [...selectedPriority, priority];

    setSelectedPriority(newPriority);
    onFilterChange({
      priority: newPriority.length > 0 ? newPriority : undefined,
    });
  };

  const handleClearAll = () => {
    setSelectedStatus([]);
    setSelectedPriority([]);
    onClearFilters();
  };

  const hasActiveFilters =
    selectedStatus.length > 0 || selectedPriority.length > 0;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <FunnelIcon className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {selectedStatus.length + selectedPriority.length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-1"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`
                    px-3 py-1.5 text-sm rounded-md transition-colors
                    ${
                      selectedStatus.includes(status)
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    }
                  `}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`
                    px-3 py-1.5 text-sm rounded-md transition-colors
                    ${
                      selectedPriority.includes(priority)
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
