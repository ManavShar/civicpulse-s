/**
 * Theme configuration for CivicPulse AI
 * Provides consistent colors, styles, and utilities for light and dark modes
 */

export type Theme = "light" | "dark";

export interface ThemeColors {
  // Chart colors that work in both light and dark modes
  charts: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    purple: string;
    pink: string;
  };

  // Severity colors
  severity: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };

  // Status colors
  status: {
    active: string;
    resolved: string;
    dismissed: string;
    pending: string;
  };
}

export const themeColors: ThemeColors = {
  charts: {
    primary: "#0ea5e9", // sky-500
    secondary: "#8b5cf6", // violet-500
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444", // red-500
    info: "#3b82f6", // blue-500
    purple: "#a855f7", // purple-500
    pink: "#ec4899", // pink-500
  },

  severity: {
    critical: "#dc2626", // red-600
    high: "#ea580c", // orange-600
    medium: "#ca8a04", // yellow-600
    low: "#2563eb", // blue-600
  },

  status: {
    active: "#dc2626", // red-600
    resolved: "#16a34a", // green-600
    dismissed: "#6b7280", // gray-500
    pending: "#f59e0b", // amber-500
  },
};

/**
 * Get chart axis colors based on current theme
 */
export function getChartAxisColors(theme: Theme) {
  return {
    stroke: theme === "dark" ? "#4b5563" : "#d1d5db", // gray-600 : gray-300
    tick: theme === "dark" ? "#9ca3af" : "#6b7280", // gray-400 : gray-500
    label: theme === "dark" ? "#d1d5db" : "#374151", // gray-300 : gray-700
  };
}

/**
 * Get chart grid colors based on current theme
 */
export function getChartGridColors(theme: Theme) {
  return {
    stroke: theme === "dark" ? "#374151" : "#e5e7eb", // gray-700 : gray-200
    strokeDasharray: "3 3",
  };
}

/**
 * Get tooltip background colors based on current theme
 */
export function getTooltipColors(theme: Theme) {
  return {
    background: theme === "dark" ? "#1f2937" : "#ffffff", // gray-800 : white
    border: theme === "dark" ? "#374151" : "#e5e7eb", // gray-700 : gray-200
    text: theme === "dark" ? "#f9fafb" : "#111827", // gray-50 : gray-900
    label: theme === "dark" ? "#d1d5db" : "#6b7280", // gray-300 : gray-500
  };
}

/**
 * Get map style URL based on theme
 */
export function getMapStyle(theme: Theme): string {
  return theme === "dark"
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";
}

/**
 * Theme-aware class names helper
 */
export function themeClass(
  lightClass: string,
  darkClass: string,
  theme: Theme
): string {
  return theme === "dark" ? darkClass : lightClass;
}
