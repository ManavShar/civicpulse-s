import { useState } from "react";
import { Select, Button } from "@/components/ui";
import { SensorType } from "@/types";

interface PredictionFiltersProps {
  onFilterChange: (filters: PredictionFilters) => void;
  onClearFilters: () => void;
}

export interface PredictionFilters {
  sensorType?: SensorType;
  minConfidence?: number;
  timeHorizon?: "1h" | "6h" | "12h" | "24h" | "all";
}

export function PredictionFilters({
  onFilterChange,
  onClearFilters,
}: PredictionFiltersProps) {
  const [sensorType, setSensorType] = useState<SensorType | "all">("all");
  const [minConfidence, setMinConfidence] = useState<string>("0");
  const [timeHorizon, setTimeHorizon] = useState<string>("all");

  const handleApplyFilters = () => {
    const filters: PredictionFilters = {};

    if (sensorType !== "all") {
      filters.sensorType = sensorType as SensorType;
    }

    if (minConfidence !== "0") {
      filters.minConfidence = parseFloat(minConfidence);
    }

    if (timeHorizon !== "all") {
      filters.timeHorizon = timeHorizon as PredictionFilters["timeHorizon"];
    }

    onFilterChange(filters);
  };

  const handleClear = () => {
    setSensorType("all");
    setMinConfidence("0");
    setTimeHorizon("all");
    onClearFilters();
  };

  const sensorTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "WASTE", label: "Waste" },
    { value: "LIGHT", label: "Light" },
    { value: "WATER", label: "Water" },
    { value: "TRAFFIC", label: "Traffic" },
    { value: "ENVIRONMENT", label: "Environment" },
    { value: "NOISE", label: "Noise" },
  ];

  const confidenceOptions = [
    { value: "0", label: "All Confidence Levels" },
    { value: "0.5", label: "50% or higher" },
    { value: "0.6", label: "60% or higher" },
    { value: "0.7", label: "70% or higher" },
    { value: "0.8", label: "80% or higher" },
    { value: "0.9", label: "90% or higher" },
  ];

  const timeHorizonOptions = [
    { value: "all", label: "All Time Horizons" },
    { value: "1h", label: "Next 1 hour" },
    { value: "6h", label: "Next 6 hours" },
    { value: "12h", label: "Next 12 hours" },
    { value: "24h", label: "Next 24 hours" },
  ];

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sensor Type
          </label>
          <Select
            value={sensorType}
            onChange={(e) =>
              setSensorType(e.target.value as SensorType | "all")
            }
            options={sensorTypeOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Confidence
          </label>
          <Select
            value={minConfidence}
            onChange={(e) => setMinConfidence(e.target.value)}
            options={confidenceOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Horizon
          </label>
          <Select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            options={timeHorizonOptions}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} variant="primary" size="sm">
          Apply Filters
        </Button>
        <Button onClick={handleClear} variant="secondary" size="sm">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
