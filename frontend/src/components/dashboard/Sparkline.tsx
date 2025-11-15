import { useMemo } from "react";
import { motion } from "framer-motion";

export interface SparklineProps {
  data: number[];
  color?: string;
  strokeWidth?: number;
  animate?: boolean;
}

export function Sparkline({
  data,
  color = "text-blue-600",
  strokeWidth = 2,
  animate = true,
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (data.length === 0) return "";

    const width = 100;
    const height = 100;
    const padding = 5;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y =
        height - ((value - min) / range) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data]);

  if (data.length === 0) {
    return null;
  }

  // Extract color class to actual color value
  const strokeColor = color.includes("blue")
    ? "#3b82f6"
    : color.includes("green")
    ? "#10b981"
    : color.includes("red")
    ? "#ef4444"
    : color.includes("yellow")
    ? "#f59e0b"
    : "#6b7280";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <motion.path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={animate ? { duration: 0.8, ease: "easeInOut" } : undefined}
      />
    </svg>
  );
}
