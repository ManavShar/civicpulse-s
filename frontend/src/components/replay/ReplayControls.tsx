import { useState } from "react";
import { useReplayStore } from "../../stores/replayStore";
import { useReplayData } from "../../hooks/useReplayData";
import { Button } from "../ui/Button";
import { Calendar, X } from "lucide-react";

export function ReplayControls() {
  const { isReplayMode, setReplayMode, setTimeRange, setCurrentTime, reset } =
    useReplayStore();

  const { fetchTimeline } = useReplayData({ autoFetch: false });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");

  const handleEnterReplayMode = () => {
    setShowDatePicker(true);
  };

  const handleExitReplayMode = () => {
    reset();
    setReplayMode(false);
    setShowDatePicker(false);
  };

  const handleStartReplay = async () => {
    if (!tempStartDate || !tempStartTime || !tempEndDate || !tempEndTime) {
      alert("Please select both start and end times");
      return;
    }

    const start = new Date(`${tempStartDate}T${tempStartTime}`);
    const end = new Date(`${tempEndDate}T${tempEndTime}`);

    if (start >= end) {
      alert("Start time must be before end time");
      return;
    }

    setTimeRange(start, end);
    setCurrentTime(start);
    setReplayMode(true);
    setShowDatePicker(false);

    // Fetch timeline data
    await fetchTimeline(start, end);
  };

  const getDefaultDates = () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      startDate: yesterday.toISOString().split("T")[0],
      startTime: "00:00",
      endDate: now.toISOString().split("T")[0],
      endTime: now.toTimeString().slice(0, 5),
    };
  };

  const defaults = getDefaultDates();

  if (!isReplayMode && !showDatePicker) {
    return (
      <div className="flex justify-center">
        <Button variant="primary" onClick={handleEnterReplayMode}>
          <Calendar className="w-4 h-4 mr-2" />
          Enter Replay Mode
        </Button>
      </div>
    );
  }

  if (showDatePicker) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Time Range for Replay
          </h3>
          <button
            onClick={() => setShowDatePicker(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={tempStartDate || defaults.startDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="time"
                value={tempStartTime || defaults.startTime}
                onChange={(e) => setTempStartTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={tempEndDate || defaults.endDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="time"
                value={tempEndTime || defaults.endTime}
                onChange={(e) => setTempEndTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                  setTempStartDate(oneHourAgo.toISOString().split("T")[0]);
                  setTempStartTime(oneHourAgo.toTimeString().slice(0, 5));
                  setTempEndDate(now.toISOString().split("T")[0]);
                  setTempEndTime(now.toTimeString().slice(0, 5));
                }}
              >
                Last Hour
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const sixHoursAgo = new Date(
                    now.getTime() - 6 * 60 * 60 * 1000
                  );
                  setTempStartDate(sixHoursAgo.toISOString().split("T")[0]);
                  setTempStartTime(sixHoursAgo.toTimeString().slice(0, 5));
                  setTempEndDate(now.toISOString().split("T")[0]);
                  setTempEndTime(now.toTimeString().slice(0, 5));
                }}
              >
                Last 6 Hours
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const yesterday = new Date(
                    now.getTime() - 24 * 60 * 60 * 1000
                  );
                  setTempStartDate(yesterday.toISOString().split("T")[0]);
                  setTempStartTime("00:00");
                  setTempEndDate(now.toISOString().split("T")[0]);
                  setTempEndTime(now.toTimeString().slice(0, 5));
                }}
              >
                Last 24 Hours
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDatePicker(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStartReplay}>
              Start Replay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <Button variant="secondary" onClick={handleExitReplayMode}>
        <X className="w-4 h-4 mr-2" />
        Exit Replay Mode
      </Button>
    </div>
  );
}
