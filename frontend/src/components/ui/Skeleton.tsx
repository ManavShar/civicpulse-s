import { HTMLAttributes } from "react";
import clsx from "clsx";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200 dark:bg-gray-800",
        {
          rounded: variant === "text",
          "rounded-full": variant === "circular",
          "rounded-lg": variant === "rectangular",
        },
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      {...props}
    />
  );
}

// Skeleton variants for common use cases
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? "80%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={16} width="60%" />
          <Skeleton variant="text" height={14} width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
