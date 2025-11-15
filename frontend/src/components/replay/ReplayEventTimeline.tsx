import { useState, useMemo } from "react";
import { useReplayStore } from "../../stores/replayStore";
import { TimelineEvent } from "../../types";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function ReplayEventTimeline() {
  const { events, currentTime, setCurrentTime } = useReplayStore();

  const [selectedEventType, setSelectedEventType] = useState<
    TimelineEvent["type"] | "ALL"
  >("ALL");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Group events by type
  const eventGroups = useMemo(() => {
    const groups: Record<TimelineEvent["type"], TimelineEvent[]> = {
      SENSOR: [],
      INCIDENT: [],
      WORKORDER: [],
      AGENT: [],
    };

    events.forEach((event) => {
      groups[event.type].push(event);
    });

    return Object.entries(groups).map(([type, events]) => ({
      type: type as TimelineEvent["type"],
      events,
      count: events.length,
    }));
  }, [events]);

  // Filter events based on selection
  const filteredEvents = useMemo(() => {
    if (selectedEventType === "ALL") {
      return events;
    }
    return events.filter((e) => e.type === selectedEventType);
  }, [events, selectedEventType]);

  // Sort events by timestamp (most recent first)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredEvents]);

  // Get icon for event type
  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "SENSOR":
        return <Activity className="w-4 h-4" />;
      case "INCIDENT":
        return <AlertTriangle className="w-4 h-4" />;
      case "WORKORDER":
        return <Briefcase className="w-4 h-4" />;
      case "AGENT":
        return <Brain className="w-4 h-4" />;
    }
  };

  // Get color for event type
  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "SENSOR":
        return "bg-gray-500";
      case "INCIDENT":
        return "bg-red-500";
      case "WORKORDER":
        return "bg-green-500";
      case "AGENT":
        return "bg-purple-500";
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Check if event is in the past relative to current time
  const isEventInPast = (eventTime: Date) => {
    if (!currentTime) return true;
    return new Date(eventTime).getTime() <= currentTime.getTime();
  };

  // Handle event click
  const handleEventClick = (event: TimelineEvent) => {
    setCurrentTime(new Date(event.timestamp));
    setExpandedEvent(
      expandedEvent === event.data.id ? null : event.data.id || null
    );
  };

  // Render event details
  const renderEventDetails = (event: TimelineEvent) => {
    const data = event.data;

    switch (event.type) {
      case "SENSOR":
        return (
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Sensor:</span> {data.sensorId}
            </p>
            <p>
              <span className="font-medium">Value:</span> {data.value}{" "}
              {data.unit}
            </p>
          </div>
        );

      case "INCIDENT":
        return (
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Type:</span> {data.category}
            </p>
            <p>
              <span className="font-medium">Severity:</span>{" "}
              <Badge variant={data.severity.toLowerCase()}>
                {data.severity}
              </Badge>
            </p>
            <p>
              <span className="font-medium">Priority Score:</span>{" "}
              {data.priorityScore}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {data.description}
            </p>
          </div>
        );

      case "WORKORDER":
        return (
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Title:</span> {data.title}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <Badge variant={data.status.toLowerCase()}>{data.status}</Badge>
            </p>
            <p>
              <span className="font-medium">Assigned Unit:</span>{" "}
              {data.assignedUnitId || "Unassigned"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {data.description}
            </p>
          </div>
        );

      case "AGENT":
        return (
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Agent:</span> {data.agentType}
            </p>
            <p>
              <span className="font-medium">Step:</span> {data.step}
            </p>
            {data.data && (
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Event Type Filters */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Event Types
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEventType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedEventType === "ALL"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({events.length})
            </button>
            {eventGroups.map((group) => (
              <button
                key={group.type}
                onClick={() => setSelectedEventType(group.type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedEventType === group.type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${getEventColor(
                    group.type
                  )}`}
                />
                <span>
                  {group.type} ({group.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Event Timeline */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Event Timeline
          </h3>

          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No events found for the selected time range
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sortedEvents.map((event, index) => {
                const isPast = isEventInPast(event.timestamp);
                const isExpanded = expandedEvent === event.data.id;

                return (
                  <div
                    key={`${event.type}-${index}`}
                    className={`border rounded-lg transition-all ${
                      isPast
                        ? "border-gray-300 dark:border-gray-600 opacity-60"
                        : "border-blue-500 dark:border-blue-400"
                    } ${
                      isExpanded
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <button
                      onClick={() => handleEventClick(event)}
                      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${getEventColor(
                              event.type
                            )} text-white`}
                          >
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {event.type}
                              </span>
                              {!isPast && <Badge variant="info">Current</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {formatTimestamp(event.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        {renderEventDetails(event)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
