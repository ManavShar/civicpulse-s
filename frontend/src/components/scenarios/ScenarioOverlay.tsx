import { useEffect, useState } from "react";
import { useScenarioStore } from "../../stores/scenarioStore";

const SCENARIO_COLORS: Record<
  string,
  { bg: string; border: string; glow: string }
> = {
  flood: {
    bg: "rgba(59, 130, 246, 0.05)",
    border: "rgba(59, 130, 246, 0.3)",
    glow: "rgba(59, 130, 246, 0.2)",
  },
  fire: {
    bg: "rgba(239, 68, 68, 0.05)",
    border: "rgba(239, 68, 68, 0.3)",
    glow: "rgba(239, 68, 68, 0.2)",
  },
  "traffic-congestion": {
    bg: "rgba(245, 158, 11, 0.05)",
    border: "rgba(245, 158, 11, 0.3)",
    glow: "rgba(245, 158, 11, 0.2)",
  },
  "heat-wave": {
    bg: "rgba(249, 115, 22, 0.05)",
    border: "rgba(249, 115, 22, 0.3)",
    glow: "rgba(249, 115, 22, 0.2)",
  },
  "power-outage": {
    bg: "rgba(139, 92, 246, 0.05)",
    border: "rgba(139, 92, 246, 0.3)",
    glow: "rgba(139, 92, 246, 0.2)",
  },
};

export function ScenarioOverlay() {
  const { activeScenario } = useScenarioStore();
  const [visible, setVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (activeScenario) {
      // Fade in animation
      setTimeout(() => setVisible(true), 50);

      // Update remaining time
      const updateTime = () => {
        const now = Date.now();
        const end = new Date(activeScenario.endTime).getTime();
        const remaining = Math.max(0, end - now);
        setRemainingTime(remaining);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setVisible(false);
      return undefined;
    }
  }, [activeScenario]);

  if (!activeScenario) return null;

  const colors = SCENARIO_COLORS[activeScenario.id] || SCENARIO_COLORS.flood;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Full-screen overlay with scenario-specific tint */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: colors.bg,
          boxShadow: `inset 0 0 100px ${colors.glow}`,
        }}
      />

      {/* Animated border pulse */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            border: `2px solid ${colors.border}`,
            borderRadius: "0px",
          }}
        />
      </div>

      {/* Scenario indicator badge */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-500 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 p-4 min-w-[280px]"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Scenario Active
              </span>
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {activeScenario.name}
          </h4>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {activeScenario.description}
          </p>

          {/* Countdown timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-gray-500"
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Time Remaining
              </span>
            </div>
            <span
              className="text-lg font-mono font-bold"
              style={{ color: colors.border }}
            >
              {formatTime(remainingTime)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: colors.border,
                  width: `${
                    ((new Date(activeScenario.endTime).getTime() - Date.now()) /
                      (new Date(activeScenario.endTime).getTime() -
                        new Date(activeScenario.startTime).getTime())) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Corner indicators */}
      <div
        className={`fixed top-0 left-0 w-20 h-20 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            borderTop: `3px solid ${colors.border}`,
            borderLeft: `3px solid ${colors.border}`,
          }}
        />
      </div>

      <div
        className={`fixed top-0 right-0 w-20 h-20 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute top-0 right-0 w-full h-full"
          style={{
            borderTop: `3px solid ${colors.border}`,
            borderRight: `3px solid ${colors.border}`,
          }}
        />
      </div>

      <div
        className={`fixed bottom-0 left-0 w-20 h-20 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute bottom-0 left-0 w-full h-full"
          style={{
            borderBottom: `3px solid ${colors.border}`,
            borderLeft: `3px solid ${colors.border}`,
          }}
        />
      </div>

      <div
        className={`fixed bottom-0 right-0 w-20 h-20 pointer-events-none z-40 transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute bottom-0 right-0 w-full h-full"
          style={{
            borderBottom: `3px solid ${colors.border}`,
            borderRight: `3px solid ${colors.border}`,
          }}
        />
      </div>
    </>
  );
}
