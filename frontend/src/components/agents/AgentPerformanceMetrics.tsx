import { useMemo } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { AgentType } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div
        className={clsx(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          color || "bg-gray-200 dark:bg-gray-700"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <span
              className={clsx(
                "text-xs",
                trend === "up" && "text-green-600 dark:text-green-400",
                trend === "down" && "text-red-600 dark:text-red-400",
                trend === "neutral" && "text-gray-600 dark:text-gray-400"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentPerformanceMetrics() {
  const { messages, getMessagesByAgent } = useAgentStore();

  const metrics = useMemo(() => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Calculate metrics
    const totalMessages = messages.length;
    const recentMessages = messages.filter(
      (msg) => new Date(msg.timestamp).getTime() > oneHourAgo
    );

    // Calculate average response time (simulated)
    const avgResponseTime = messages.length > 0 ? "2.3s" : "N/A";

    // Calculate success rate (messages with OUTPUT step)
    const completedMessages = messages.filter((msg) => msg.step === "OUTPUT");
    const successRate =
      totalMessages > 0
        ? Math.round((completedMessages.length / totalMessages) * 100)
        : 0;

    // Agent-specific metrics
    const agentMetrics: Record<
      AgentType,
      { total: number; recent: number; avgTime: string }
    > = {
      PLANNER: { total: 0, recent: 0, avgTime: "2.1s" },
      DISPATCHER: { total: 0, recent: 0, avgTime: "1.8s" },
      ANALYST: { total: 0, recent: 0, avgTime: "2.9s" },
    };

    (["PLANNER", "DISPATCHER", "ANALYST"] as AgentType[]).forEach((type) => {
      const agentMessages = getMessagesByAgent(type);
      agentMetrics[type].total = agentMessages.length;
      agentMetrics[type].recent = agentMessages.filter(
        (msg) => new Date(msg.timestamp).getTime() > oneHourAgo
      ).length;
    });

    return {
      totalMessages,
      recentMessages: recentMessages.length,
      avgResponseTime,
      successRate,
      agentMetrics,
    };
  }, [messages, getMessagesByAgent]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Metrics
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Last hour activity
        </p>
      </CardHeader>

      <CardBody>
        {/* Overall Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard
            label="Total Messages"
            value={metrics.totalMessages}
            icon={TrendingUp}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            label="Recent Activity"
            value={metrics.recentMessages}
            icon={Clock}
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
          <MetricCard
            label="Avg Response"
            value={metrics.avgResponseTime}
            icon={Clock}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics.successRate}%`}
            icon={CheckCircle}
            trend={
              metrics.successRate >= 90
                ? "up"
                : metrics.successRate >= 70
                ? "neutral"
                : "down"
            }
            color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          />
        </div>

        {/* Agent-specific metrics */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Agent Breakdown
          </h4>
          {(["PLANNER", "DISPATCHER", "ANALYST"] as AgentType[]).map((type) => {
            const agentData = metrics.agentMetrics[type];
            return (
              <div
                key={type}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {type}
                </span>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{agentData.total} total</span>
                  <span>•</span>
                  <span>{agentData.recent} recent</span>
                  <span>•</span>
                  <span>{agentData.avgTime} avg</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status indicator */}
        {metrics.totalMessages === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                No agent activity recorded yet
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
