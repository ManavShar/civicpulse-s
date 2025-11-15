import { AgentMessage } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import clsx from "clsx";

interface AgentTimelineProps {
  messages: AgentMessage[];
  incidentId?: string;
}

export function AgentTimeline({ messages, incidentId }: AgentTimelineProps) {
  // Filter messages by incident if provided
  const filteredMessages = incidentId
    ? messages.filter((msg) => msg.incidentId === incidentId)
    : messages;

  // Sort by timestamp
  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getAgentColor = (agentType: string) => {
    const colors: Record<string, string> = {
      PLANNER: "bg-blue-500",
      DISPATCHER: "bg-green-500",
      ANALYST: "bg-purple-500",
    };
    return colors[agentType] || "bg-gray-500";
  };

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      INPUT: "Started",
      OUTPUT: "Completed",
      PLANNING: "Planning",
      DISPATCHING: "Dispatching",
      EXPLAINING: "Analyzing",
    };
    return labels[step] || step;
  };

  if (sortedMessages.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No agent activity to display
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Decision Timeline
        </h4>
        {incidentId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Incident: {incidentId.substring(0, 8)}
          </p>
        )}
      </CardHeader>

      <CardBody className="p-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Timeline items */}
          <div className="space-y-0">
            {sortedMessages.map((message) => (
              <div key={message.id} className="relative flex gap-4 p-4">
                {/* Timeline dot */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={clsx(
                      "w-3 h-3 rounded-full",
                      getAgentColor(message.agentType)
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {message.agentType}
                    </span>
                    <Badge variant="default" size="sm">
                      {getStepLabel(message.step)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {/* Message summary */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {message.data.plan?.situation_summary ||
                      message.data.explanation?.explanation ||
                      `Processing ${message.step.toLowerCase()}`}
                  </p>

                  {/* Additional info */}
                  {message.workOrderId && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created work order:{" "}
                        {message.workOrderId.substring(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
