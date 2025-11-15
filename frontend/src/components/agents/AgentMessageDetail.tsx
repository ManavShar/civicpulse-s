import { AgentMessage } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReasoningChain } from "./ReasoningChain";
import { X, ExternalLink } from "lucide-react";
import clsx from "clsx";

interface AgentMessageDetailProps {
  message: AgentMessage;
  onClose?: () => void;
  onViewIncident?: (incidentId: string) => void;
  onViewWorkOrder?: (workOrderId: string) => void;
}

export function AgentMessageDetail({
  message,
  onClose,
  onViewIncident,
  onViewWorkOrder,
}: AgentMessageDetailProps) {
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getAgentColor = (agentType: string) => {
    const colors: Record<string, string> = {
      PLANNER: "text-blue-600 dark:text-blue-400",
      DISPATCHER: "text-green-600 dark:text-green-400",
      ANALYST: "text-purple-600 dark:text-purple-400",
    };
    return colors[agentType] || "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3
                  className={clsx(
                    "text-xl font-bold",
                    getAgentColor(message.agentType)
                  )}
                >
                  {message.agentType} Agent
                </h3>
                <Badge variant="info">{message.step}</Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(message.timestamp)}
              </p>
            </div>

            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {/* Related entities */}
          <div className="flex flex-wrap gap-2">
            {message.incidentId && (
              <button
                onClick={() => onViewIncident?.(message.incidentId!)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incident: {message.incidentId.substring(0, 8)}
                </span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </button>
            )}

            {message.workOrderId && (
              <button
                onClick={() => onViewWorkOrder?.(message.workOrderId!)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Work Order: {message.workOrderId.substring(0, 8)}
                </span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Reasoning Chain */}
      <ReasoningChain message={message} />

      {/* Raw Data (for debugging) */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Raw Data
          </h4>
        </CardHeader>
        <CardBody>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <code>{JSON.stringify(message.data, null, 2)}</code>
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}
