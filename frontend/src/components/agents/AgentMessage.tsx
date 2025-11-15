import { AgentMessage as AgentMessageType, AgentType } from "@/types";
import { Badge } from "@/components/ui/Badge";
import clsx from "clsx";
import { Brain, Send, BarChart3 } from "lucide-react";

interface AgentMessageProps {
  message: AgentMessageType;
  onClick?: () => void;
}

const agentConfig: Record<
  AgentType,
  { icon: typeof Brain; color: string; label: string }
> = {
  PLANNER: {
    icon: Brain,
    color: "text-blue-600 dark:text-blue-400",
    label: "Planner",
  },
  DISPATCHER: {
    icon: Send,
    color: "text-green-600 dark:text-green-400",
    label: "Dispatcher",
  },
  ANALYST: {
    icon: BarChart3,
    color: "text-purple-600 dark:text-purple-400",
    label: "Analyst",
  },
};

export function AgentMessage({ message, onClick }: AgentMessageProps) {
  const config = agentConfig[message.agentType];
  const Icon = config.icon;

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMessageTypeLabel = (step: string) => {
    const labels: Record<string, string> = {
      INPUT: "Analyzing",
      OUTPUT: "Completed",
      PLANNING: "Planning",
      DISPATCHING: "Dispatching",
      EXPLAINING: "Explaining",
    };
    return labels[step] || step;
  };

  const getMessageContent = () => {
    // Extract meaningful content from data
    if (message.data.plan) {
      return message.data.plan.situation_summary || "Action plan created";
    }
    if (message.data.explanation) {
      return message.data.explanation.explanation || "Analysis complete";
    }
    if (message.data.assignments) {
      return `Dispatched ${message.data.assignments.length} unit(s)`;
    }
    if (message.data.incident_id) {
      return `Processing incident ${message.data.incident_id.substring(
        0,
        8
      )}...`;
    }
    return "Processing...";
  };

  return (
    <div
      className={clsx(
        "flex gap-3 p-4 rounded-lg transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Agent Avatar */}
      <div
        className={clsx(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <Icon className={clsx("w-5 h-5", config.color)} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className={clsx("font-semibold text-sm", config.color)}>
            {config.label}
          </span>
          <Badge variant="default" size="sm">
            {getMessageTypeLabel(message.step)}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Message Body */}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {getMessageContent()}
        </p>

        {/* Metadata */}
        {(message.incidentId || message.workOrderId) && (
          <div className="flex gap-2 mt-2">
            {message.incidentId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Incident: {message.incidentId.substring(0, 8)}
              </span>
            )}
            {message.workOrderId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Work Order: {message.workOrderId.substring(0, 8)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
