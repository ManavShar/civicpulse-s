import { useEffect, useState } from "react";

interface ScenarioStatusProps {
  scenarioName: string;
  startTime: Date;
  endTime: Date;
  onStop: () => void;
}

export function ScenarioStatus({
  scenarioName,
  startTime,
  endTime,
  onStop,
}: ScenarioStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTimes = () => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      const elapsed = Math.max(0, now - start);
      const remaining = Math.max(0, end - now);

      setElapsedTime(elapsed);
      setRemainingTime(remaining);
    };

    // Update immediately
    updateTimes();

    // Update every second
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress =
    (elapsedTime /
      (new Date(endTime).getTime() - new Date(startTime).getTime())) *
    100;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Active Scenario
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {scenarioName}
          </p>
        </div>
        <button
          onClick={onStop}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
        >
          Stop Scenario
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
          <span>Elapsed: {formatTime(elapsedTime)}</span>
          <span>Remaining: {formatTime(remainingTime)}</span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Timer Display */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-md p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Elapsed
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-md p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatTime(remainingTime)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
      </div>
    </div>
  );
}
