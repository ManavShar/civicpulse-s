import { useEffect, useRef, useState } from "react";
import { useReplayStore } from "../../stores/replayStore";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "../ui/Button";

interface TimelineReplayProps {
  onTimeChange?: (time: Date) => void;
}

export function TimelineReplay({ onTimeChange }: TimelineReplayProps) {
  const {
    isPlaying,
    playbackSpeed,
    startTime,
    endTime,
    currentTime,
    events,
    setPlaying,
    setPlaybackSpeed,
    setCurrentTime,
  } = useReplayStore();

  const [isDragging, setIsDragging] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Calculate progress percentage
  const getProgress = () => {
    if (!startTime || !endTime || !currentTime) return 0;
    const total = endTime.getTime() - startTime.getTime();
    const current = currentTime.getTime() - startTime.getTime();
    return Math.max(0, Math.min(100, (current / total) * 100));
  };

  // Handle playback
  useEffect(() => {
    if (!isPlaying || !startTime || !endTime || !currentTime) return;

    const animate = () => {
      const increment = 1000 * playbackSpeed; // 1 second * speed

      setCurrentTime(new Date(currentTime.getTime() + increment));

      // Check if we've reached the end
      if (currentTime.getTime() + increment >= endTime.getTime()) {
        setPlaying(false);
        setCurrentTime(endTime);
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 1000 / playbackSpeed);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPlaying,
    currentTime,
    startTime,
    endTime,
    playbackSpeed,
    setPlaying,
    setCurrentTime,
  ]);

  // Notify parent of time changes
  useEffect(() => {
    if (currentTime && onTimeChange) {
      onTimeChange(currentTime);
    }
  }, [currentTime, onTimeChange]);

  // Handle scrubber click/drag
  const handleScrubberInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !startTime || !endTime) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    const total = endTime.getTime() - startTime.getTime();
    const newTime = new Date(startTime.getTime() + (total * percentage) / 100);

    setCurrentTime(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleScrubberInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleScrubberInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Playback controls
  const togglePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const skipBackward = () => {
    if (!currentTime || !startTime) return;
    const newTime = new Date(
      Math.max(startTime.getTime(), currentTime.getTime() - 60000)
    ); // 1 minute back
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    if (!currentTime || !endTime) return;
    const newTime = new Date(
      Math.min(endTime.getTime(), currentTime.getTime() + 60000)
    ); // 1 minute forward
    setCurrentTime(newTime);
  };

  const speedOptions = [0.5, 1, 2, 5, 10];

  // Get event markers for timeline
  const getEventMarkers = () => {
    if (!startTime || !endTime) return [];

    return events.map((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      const total = endTime.getTime() - startTime.getTime();
      const position = ((eventTime - startTime.getTime()) / total) * 100;

      return {
        event,
        position: Math.max(0, Math.min(100, position)),
      };
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-- --- ----";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
      {/* Time Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDate(currentTime)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Speed:
          </span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <div
          ref={scrubberRef}
          className="relative h-12 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-600 rounded-lg transition-all"
            style={{ width: `${getProgress()}%` }}
          />

          {/* Event Markers */}
          {getEventMarkers().map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 h-full w-1 group"
              style={{ left: `${marker.position}%` }}
              title={`${marker.event.type} at ${formatTime(
                new Date(marker.event.timestamp)
              )}`}
            >
              <div
                className={`h-full w-1 ${
                  marker.event.type === "INCIDENT"
                    ? "bg-red-500"
                    : marker.event.type === "WORKORDER"
                    ? "bg-green-500"
                    : marker.event.type === "AGENT"
                    ? "bg-purple-500"
                    : "bg-gray-400"
                }`}
              />
            </div>
          ))}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-lg"
            style={{ left: `${getProgress()}%` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg" />
          </div>
        </div>

        {/* Time Range Labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(endTime)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={skipBackward}
          disabled={!currentTime || !startTime}
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={togglePlayPause}
          disabled={!startTime || !endTime}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={skipForward}
          disabled={!currentTime || !endTime}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Replay Mode Indicator */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
          Replay Mode Active
        </div>
      </div>
    </div>
  );
}
