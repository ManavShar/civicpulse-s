import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useIncidentStore } from "@/stores/incidentStore";
import { IncidentCard } from "./IncidentCard";
import { IncidentFilters } from "./IncidentFilters";
import { Select, Skeleton } from "@/components/ui";

interface IncidentListProps {
  onIncidentSelect?: (id: string) => void;
}

export function IncidentList({ onIncidentSelect }: IncidentListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const selectedIncidentId = useIncidentStore(
    (state) => state.selectedIncidentId
  );
  const sortBy = useIncidentStore((state) => state.sortBy);
  const sortOrder = useIncidentStore((state) => state.sortOrder);
  const loading = useIncidentStore((state) => state.loading);
  const error = useIncidentStore((state) => state.error);
  const allIncidents = useIncidentStore((state) => state.incidents) || [];
  const filters = useIncidentStore((state) => state.filters) || {};
  const setFilters = useIncidentStore((state) => state.setFilters);
  const clearFilters = useIncidentStore((state) => state.clearFilters);
  const setSortBy = useIncidentStore((state) => state.setSortBy);
  const setSortOrder = useIncidentStore((state) => state.setSortOrder);

  // Compute filtered and sorted incidents with useMemo
  const incidents = useMemo(() => {
    // Safety check: ensure allIncidents is an array
    if (!Array.isArray(allIncidents)) {
      return [];
    }

    // Filter incidents
    let filtered = [...allIncidents];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((i) => filters.status!.includes(i.status));
    }

    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter((i) => filters.severity!.includes(i.severity));
    }

    if (filters.zoneId) {
      filtered = filtered.filter((i) => i.zoneId === filters.zoneId);
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((i) => filters.category!.includes(i.category));
    }

    // Sort incidents
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "priority":
          comparison = a.priorityScore - b.priorityScore;
          break;
        case "time":
          comparison =
            new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
          break;
        case "severity":
          const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [allIncidents, filters, sortBy, sortOrder]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: incidents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [
      "priority" | "time" | "severity",
      "asc" | "desc"
    ];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const sortOptions = [
    { value: "priority-desc", label: "Priority (High to Low)" },
    { value: "priority-asc", label: "Priority (Low to High)" },
    { value: "time-desc", label: "Time (Newest First)" },
    { value: "time-asc", label: "Time (Oldest First)" },
    { value: "severity-desc", label: "Severity (High to Low)" },
    { value: "severity-asc", label: "Severity (Low to High)" },
  ];

  const currentSortValue = `${sortBy}-${sortOrder}`;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error loading incidents: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Incidents
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {incidents.length} incident{incidents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <IncidentFilters
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <Select
            value={currentSortValue}
            onChange={(e) => handleSortChange(e.target.value)}
            options={sortOptions}
            className="w-64"
          />
        </div>
      </div>

      {/* Incident List with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto p-4"
        style={{ height: "calc(100vh - 300px)" }}
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No incidents found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Try adjusting your filters
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const incident = incidents[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="pb-4">
                    <IncidentCard
                      incident={incident}
                      onSelect={onIncidentSelect}
                      isSelected={incident.id === selectedIncidentId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
