import { AgentType } from "@/types";
import { Badge } from "@/components/ui/Badge";
import clsx from "clsx";

export type AgentStatus = "active" | "idle" | "processing";

interface AgentStatusBadgeProps {
  agentType: AgentType;
  status: AgentStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AgentStatusBadge({
  agentType,
  status,
  size = "md",
  showLabel = true,
}: AgentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          variant: "success" as const,
          label: "Active",
          icon: "●",
        };
      case "processing":
        return {
          variant: "warning" as const,
          label: "Processing",
          icon: "◐",
        };
      case "idle":
        return {
          variant: "default" as const,
          label: "Idle",
          icon: "○",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} size={size}>
      <span
        className={clsx(
          "inline-block mr-1",
          status === "processing" && "animate-spin"
        )}
      >
        {config.icon}
      </span>
      {showLabel && (
        <>
          {agentType} - {config.label}
        </>
      )}
    </Badge>
  );
}
