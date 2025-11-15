import { useRef, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePredictionStore } from "@/stores/predictionStore";
import { useSensorStore } from "@/stores/sensorStore";
import { PredictionCard } from "./PredictionCard";
import {
  PredictionFilters,
  PredictionFilters as FilterType,
} from "./PredictionFilters";
import { Select, Skeleton } from "@/components/ui";

interface PredictionListProps {
  onPredictionSelect?: (id: string) => void;
}

export function PredictionList({ onPredictionSelect }: PredictionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const { predictions, selectedPredictionId, loading, error } =
    usePredictionStore();

  const { getSensorById } = useSensorStore();

  const [filters, setFilters] = useState<FilterType>({});
  const [sortBy, setSortBy] = useState<"confidence" | "time" | "value">(
    "confidence"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    // Safety check: ensure predictions is an array
    if (!Array.isArray(predictions)) return [];

    let result = [...predictions];

    // Filter by sensor type
    if (filters.sensorType) {
      result = result.filter((pred) => {
        const sensor = getSensorById(pred.sensorId);
        return sensor?.type === filters.sensorType;
      });
    }

    // Filter by minimum confidence
    if (filters.minConfidence !== undefined) {
      result = result.filter(
        (pred) => pred.confidence >= filters.minConfidence!
      );
    }

    // Filter by time horizon
    if (filters.timeHorizon && filters.timeHorizon !== "all") {
      const now = new Date();
      // Extract number from string like "1h" -> 1
      const maxHours = parseInt(filters.timeHorizon.replace(/\D/g, ""));

      result = result.filter((pred) => {
        const predicted = new Date(pred.predictedTimestamp);
        const diffHours =
          (predicted.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours <= maxHours && diffHours > 0;
      });
    }

    return result;
  }, [predictions, filters, getSensorById]);

  // Sort predictions
  const sortedPredictions = useMemo(() => {
    const result = [...filteredPredictions];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "confidence":
          comparison = a.confidence - b.confidence;
          break;
        case "time":
          comparison =
            new Date(a.predictedTimestamp).getTime() -
            new Date(b.predictedTimestamp).getTime();
          break;
        case "value":
          comparison = a.predictedValue - b.predictedValue;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [filteredPredictions, sortBy, sortOrder]);

  // Get historical data for sparklines (mock for now)
  const getHistoricalData = (): number[] => {
    // In a real implementation, this would fetch recent sensor readings
    // For now, generate mock data
    return Array.from({ length: 10 }, () => Math.random() * 100);
  };

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: sortedPredictions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [
      "confidence" | "time" | "value",
      "asc" | "desc"
    ];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const sortOptions = [
    { value: "confidence-desc", label: "Confidence (High to Low)" },
    { value: "confidence-asc", label: "Confidence (Low to High)" },
    { value: "time-asc", label: "Time (Soonest First)" },
    { value: "time-desc", label: "Time (Latest First)" },
    { value: "value-desc", label: "Value (High to Low)" },
    { value: "value-asc", label: "Value (Low to High)" },
  ];

  const currentSortValue = `${sortBy}-${sortOrder}`;

  const handleClearFilters = () => {
    setFilters({});
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error loading predictions: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters and Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {sortedPredictions.length} prediction
              {sortedPredictions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <PredictionFilters
          onFilterChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-2 mt-3">
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

      {/* Prediction List with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto p-4"
        style={{ height: "calc(100vh - 350px)" }}
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : sortedPredictions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No predictions found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {predictions.length === 0
                  ? "Predictions will appear here once generated"
                  : "Try adjusting your filters"}
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
              const prediction = sortedPredictions[virtualItem.index];
              const sensor = getSensorById(prediction.sensorId);
              const historicalData = getHistoricalData();

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
                    <PredictionCard
                      prediction={prediction}
                      sensor={sensor}
                      historicalData={historicalData}
                      onSelect={onPredictionSelect}
                      isSelected={prediction.id === selectedPredictionId}
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
