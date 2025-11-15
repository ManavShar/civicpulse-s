import { useState, useEffect } from "react";
import { Scenario } from "../../types";
import { apiClient } from "../../lib/api";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioStatus } from "./ScenarioStatus";
import { useScenarioStore } from "../../stores/scenarioStore";

interface ActiveScenarioInfo {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  elapsedTime: number;
  remainingTime: number;
  triggeredIncidents: number;
}

interface ScenarioStatusResponse {
  active: boolean;
  scenario?: ActiveScenarioInfo;
}

export function ScenarioPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const { activeScenario, setActiveScenario } = useScenarioStore();

  // Fetch available scenarios
  useEffect(() => {
    fetchScenarios();
    fetchScenarioStatus();

    // Poll for status updates every 2 seconds
    const statusInterval = setInterval(fetchScenarioStatus, 2000);

    return () => clearInterval(statusInterval);
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await apiClient.scenarios.getAll();
      setScenarios(response.data.scenarios);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching scenarios:", err);
      setError("Failed to load scenarios");
      setLoading(false);
    }
  };

  const fetchScenarioStatus = async () => {
    try {
      const response = await apiClient.scenarios.getStatus();
      const status: ScenarioStatusResponse = response.data;

      if (status.active && status.scenario) {
        setActiveScenario(status.scenario);
      } else {
        setActiveScenario(null);
      }
    } catch (err) {
      console.error("Error fetching scenario status:", err);
    }
  };

  const handleTriggerScenario = async (scenarioId: string) => {
    if (triggering || activeScenario) return;

    setTriggering(true);
    setError(null);

    try {
      await apiClient.scenarios.trigger(scenarioId);
      // Status will be updated by the polling interval
      await fetchScenarioStatus();
    } catch (err: any) {
      console.error("Error triggering scenario:", err);
      const errorMessage =
        err.response?.data?.error?.message || "Failed to trigger scenario";
      setError(errorMessage);
    } finally {
      setTriggering(false);
    }
  };

  const handleStopScenario = async () => {
    try {
      await apiClient.scenarios.stop();
      setActiveScenario(null);
    } catch (err) {
      console.error("Error stopping scenario:", err);
      setError("Failed to stop scenario");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Demonstration Scenarios
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Trigger pre-configured scenarios to demonstrate system capabilities
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg
                className="h-5 w-5"
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
            </button>
          </div>
        </div>
      )}

      {/* Active Scenario Status */}
      {activeScenario && (
        <ScenarioStatus
          scenarioName={activeScenario.name}
          startTime={activeScenario.startTime}
          endTime={activeScenario.endTime}
          onStop={handleStopScenario}
        />
      )}

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isActive={activeScenario?.id === scenario.id}
            onTrigger={handleTriggerScenario}
            disabled={
              triggering ||
              (activeScenario !== null && activeScenario.id !== scenario.id)
            }
          />
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Scenarios modify sensor data patterns and trigger incidents to
              demonstrate the system's detection and response capabilities. Only
              one scenario can be active at a time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
