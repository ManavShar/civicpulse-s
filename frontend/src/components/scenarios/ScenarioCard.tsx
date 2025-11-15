import { Scenario } from "../../types";

interface ScenarioCardProps {
  scenario: Scenario;
  isActive: boolean;
  onTrigger: (scenarioId: string) => void;
  disabled?: boolean;
}

export function ScenarioCard({
  scenario,
  isActive,
  onTrigger,
  disabled = false,
}: ScenarioCardProps) {
  const handleTrigger = () => {
    if (!disabled && !isActive) {
      onTrigger(scenario.id);
    }
  };

  return (
    <div
      className={`relative rounded-lg border-2 p-6 transition-all duration-300 ${
        isActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className={`text-4xl ${isActive ? "animate-pulse" : ""}`}>
          {scenario.icon}
        </div>
        {isActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Active
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {scenario.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
        {scenario.description}
      </p>

      {/* Duration */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mb-4">
        <svg
          className="w-4 h-4 mr-1"
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
        Duration: {Math.floor(scenario.duration / 60000)} minutes
      </div>

      {/* Trigger Button */}
      <button
        onClick={handleTrigger}
        disabled={disabled || isActive}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isActive
            ? "bg-blue-500 text-white cursor-default"
            : disabled
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isActive ? "Running..." : "Trigger Scenario"}
      </button>
    </div>
  );
}
