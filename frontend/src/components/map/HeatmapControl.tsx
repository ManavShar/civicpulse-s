import { useState } from "react";
import { HeatmapType } from "./HeatmapLayer";

interface HeatmapControlProps {
  activeType: HeatmapType | null;
  onTypeChange: (type: HeatmapType | null) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

const HEATMAP_OPTIONS: { value: HeatmapType; label: string; icon: string }[] = [
  { value: "temperature", label: "Temperature", icon: "🌡️" },
  { value: "noise", label: "Noise", icon: "🔊" },
  { value: "traffic", label: "Traffic", icon: "🚗" },
  { value: "waste", label: "Waste", icon: "🗑️" },
];

export function HeatmapControl({
  activeType,
  onTypeChange,
  intensity,
  onIntensityChange,
  radius,
  onRadiusChange,
}: HeatmapControlProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <span className="font-medium text-gray-900 dark:text-white">
            Heatmap
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Heatmap Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {HEATMAP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onTypeChange(
                      activeType === option.value ? null : option.value
                    )
                  }
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeType === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Control */}
          {activeType && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                  <span>Intensity</span>
                  <span className="text-gray-500">{intensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={intensity}
                  onChange={(e) =>
                    onIntensityChange(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Radius Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                  <span>Radius</span>
                  <span className="text-gray-500">{radius}px</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
