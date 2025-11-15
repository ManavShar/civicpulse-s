import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "default", size = "md", children, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center font-medium rounded-full",
          {
            // Variants
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200":
              variant === "default",
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":
              variant === "success",
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400":
              variant === "warning",
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400":
              variant === "danger",
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400":
              variant === "info",
            // Sizes
            "px-2 py-0.5 text-xs": size === "sm",
            "px-2.5 py-1 text-sm": size === "md",
            "px-3 py-1.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Severity Badge Component
interface SeverityBadgeProps {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  size?: "sm" | "md" | "lg";
}

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const variantMap = {
    LOW: "info" as const,
    MEDIUM: "warning" as const,
    HIGH: "warning" as const,
    CRITICAL: "danger" as const,
  };

  return (
    <Badge variant={variantMap[severity]} size={size}>
      {severity}
    </Badge>
  );
}

// Priority Badge Component
interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  size?: "sm" | "md" | "lg";
}

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const variantMap = {
    LOW: "default" as const,
    MEDIUM: "info" as const,
    HIGH: "warning" as const,
    CRITICAL: "danger" as const,
  };

  return (
    <Badge variant={variantMap[priority]} size={size}>
      {priority}
    </Badge>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const variantMap: Record<
    string,
    "default" | "success" | "warning" | "danger" | "info"
  > = {
    ACTIVE: "warning",
    RESOLVED: "success",
    DISMISSED: "default",
    CREATED: "info",
    ASSIGNED: "info",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    CANCELLED: "default",
  };

  return (
    <Badge variant={variantMap[status] || "default"} size={size}>
      {status.replace("_", " ")}
    </Badge>
  );
}
