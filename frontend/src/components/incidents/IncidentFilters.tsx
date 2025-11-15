import { useState } from "react";
import { Button } from "@/components/ui";
import { IncidentStatus, Severity, IncidentCategory } from "@/types";

interface IncidentFiltersProps {
  onFilterChange: (filters: {
    status?: IncidentStatus[];
    severity?: Severity[];
    category?: IncidentCategory[];
  }) => void;
  onClearFilters: () => void;
}

export function IncidentFilters({
  onFilterChange,
  onClearFilters,
}: IncidentFiltersProps) {
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory[]>(
    []
  );

  const statusOptions: IncidentStatus[] = ["ACTIVE", "RESOLVED", "DISMISSED"];
  const severityOptions: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const categoryOptions: IncidentCategory[] = [
    "WASTE_OVERFLOW",
    "LIGHTING_FAILURE",
    "WATER_ANOMALY",
    "TRAFFIC_CONGESTION",
    "ENVIRONMENTAL_HAZARD",
    "NOISE_COMPLAINT",
  ];

  const handleStatusChange = (status: IncidentStatus) => {
    const newStatus = selectedStatus.includes(status)
      ? selectedStatus.filter((s) => s !== status)
      : [...selectedStatus, status];
    setSelectedStatus(newStatus);
    onFilterChange({
      status: newStatus.length > 0 ? newStatus : undefined,
      severity: selectedSeverity.length > 0 ? selectedSeverity : undefined,
      category: selectedCategory.length > 0 ? selectedCategory : undefined,
    });
  };

  const handleSeverityChange = (severity: Severity) => {
    const newSeverity = selectedSeverity.includes(severity)
      ? selectedSeverity.filter((s) => s !== severity)
      : [...selectedSeverity, severity];
    setSelectedSeverity(newSeverity);
    onFilterChange({
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      severity: newSeverity.length > 0 ? newSeverity : undefined,
      category: selectedCategory.length > 0 ? selectedCategory : undefined,
    });
  };

  const handleCategoryChange = (category: IncidentCategory) => {
    const newCategory = selectedCategory.includes(category)
      ? selectedCategory.filter((c) => c !== category)
      : [...selectedCategory, category];
    setSelectedCategory(newCategory);
    onFilterChange({
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      severity: selectedSeverity.length > 0 ? selectedSeverity : undefined,
      category: newCategory.length > 0 ? newCategory : undefined,
    });
  };

  const handleClear = () => {
    setSelectedStatus([]);
    setSelectedSeverity([]);
    setSelectedCategory([]);
    onClearFilters();
  };

  const hasActiveFilters =
    selectedStatus.length > 0 ||
    selectedSeverity.length > 0 ||
    selectedCategory.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="space-y-1">
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severity
          </label>
          <div className="space-y-1">
            {severityOptions.map((severity) => (
              <label
                key={severity}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSeverity.includes(severity)}
                  onChange={() => handleSeverityChange(severity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {severity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {categoryOptions.map((category) => (
              <label
                key={category}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategory.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category.replace(/_/g, " ")}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
