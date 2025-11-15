import { useEffect, useState } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { AgentType } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AgentStatusBadge, AgentStatus } from "./AgentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Brain, Send, BarChart3, Activity } from "lucide-react";
import clsx from "clsx";

interface AgentStats {
  agentType: AgentType;
  status: AgentStatus;
  messageCount: number;
  lastActivity?: Date;
  processingTime?: number;
}

export function AgentActivityDashboard() {
  const { messages, getMessagesByAgent } = useAgentStore();
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);

  useEffect(() => {
    // Calculate stats for each agent
    const stats: AgentStats[] = [
      {
        agentType: "PLANNER",
        status: "idle",
        messageCount: 0,
      },
      {
        agentType: "DISPATCHER",
        status: "idle",
        messageCount: 0,
      },
      {
        agentType: "ANALYST",
        status: "idle",
        messageCount: 0,
      },
    ];

    stats.forEach((stat) => {
      const agentMessages = getMessagesByAgent(stat.agentType);
      stat.messageCount = agentMessages.length;

      if (agentMessages.length > 0) {
        // Get last activity
        const sortedMessages = [...agentMessages].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        stat.lastActivity = sortedMessages[0].timestamp;

        // Determine status based on recent activity
        const lastActivityTime = new Date(stat.lastActivity).getTime();
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime;

        if (timeSinceLastActivity < 5000) {
          // Active in last 5 seconds
          stat.status = "processing";
        } else if (timeSinceLastActivity < 60000) {
          // Active in last minute
          stat.status = "active";
        } else {
          stat.status = "idle";
        }
      }
    });

    setAgentStats(stats);
  }, [messages, getMessagesByAgent]);

  const getAgentIcon = (agentType: AgentType) => {
    const icons = {
      PLANNER: Brain,
      DISPATCHER: Send,
      ANALYST: BarChart3,
    };
    return icons[agentType];
  };

  const getAgentColor = (agentType: AgentType) => {
    const colors = {
      PLANNER:
        "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      DISPATCHER:
        "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
      ANALYST:
        "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    };
    return colors[agentType];
  };

  const formatLastActivity = (date?: Date) => {
    if (!date) return "Never";

    const now = Date.now();
    const activityTime = new Date(date).getTime();
    const diff = now - activityTime;

    if (diff < 60000) {
      return "Just now";
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  const totalMessages = agentStats.reduce(
    (sum, stat) => sum + stat.messageCount,
    0
  );
  const activeAgents = agentStats.filter(
    (stat) => stat.status !== "idle"
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agent Activity
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {activeAgents} Active
            </Badge>
            <Badge variant="default" size="sm">
              {totalMessages} Messages
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {agentStats.map((stat) => {
            const Icon = getAgentIcon(stat.agentType);
            return (
              <div
                key={stat.agentType}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Agent Icon */}
                  <div
                    className={clsx(
                      "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                      getAgentColor(stat.agentType)
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {stat.agentType}
                      </h4>
                      <AgentStatusBadge
                        agentType={stat.agentType}
                        status={stat.status}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{stat.messageCount} messages</span>
                      <span>•</span>
                      <span>Last: {formatLastActivity(stat.lastActivity)}</span>
                    </div>
                  </div>

                  {/* Processing indicator */}
                  {stat.status === "processing" && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                        <div className="animate-pulse">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        </div>
                        Processing
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
