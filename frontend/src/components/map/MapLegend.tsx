import { SensorType, Severity } from "@/types";

interface MapLegendProps {
  showSensors?: boolean;
  showIncidents?: boolean;
}

const SENSOR_LEGEND: {
  type: SensorType;
  label: string;
  color: string;
  icon: string;
}[] = [
  { type: "WASTE", label: "Waste", color: "#f59e0b", icon: "🗑️" },
  { type: "LIGHT", label: "Light", color: "#fbbf24", icon: "💡" },
  { type: "WATER", label: "Water", color: "#3b82f6", icon: "💧" },
  { type: "TRAFFIC", label: "Traffic", color: "#ef4444", icon: "🚗" },
  { type: "ENVIRONMENT", label: "Environment", color: "#10b981", icon: "🌿" },
  { type: "NOISE", label: "Noise", color: "#8b5cf6", icon: "🔊" },
];

const INCIDENT_LEGEND: { severity: Severity; label: string; color: string }[] =
  [
    { severity: "LOW", label: "Low", color: "#10b981" },
    { severity: "MEDIUM", label: "Medium", color: "#f59e0b" },
    { severity: "HIGH", label: "High", color: "#ef4444" },
    { severity: "CRITICAL", label: "Critical", color: "#dc2626" },
  ];

export function MapLegend({
  showSensors = true,
  showIncidents = true,
}: MapLegendProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Map Legend
      </h3>

      {showSensors && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sensors
          </h4>
          <div className="space-y-1.5">
            {SENSOR_LEGEND.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showIncidents && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Incidents
          </h4>
          <div className="space-y-1.5">
            {INCIDENT_LEGEND.map((item) => (
              <div key={item.severity} className="flex items-center gap-2">
                <svg
                  width="24"
                  height="30"
                  viewBox="0 0 24 30"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 0C5.372 0 0 5.372 0 12c0 6.628 12 18 12 18s12-11.372 12-18C24 5.372 18.628 0 12 0z"
                    fill={item.color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="5" fill="white" />
                  <text
                    x="12"
                    y="15"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill={item.color}
                  >
                    !
                  </text>
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            5
          </div>
          <span>Cluster (click to zoom)</span>
        </div>
      </div>
    </div>
  );
}
