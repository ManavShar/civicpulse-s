import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  themeColors,
  getChartAxisColors,
  getChartGridColors,
  getTooltipColors,
} from "@/lib/theme";

/**
 * Hook to get theme-aware chart configuration
 */
export function useChartTheme() {
  const { theme } = useTheme();

  const chartTheme = useMemo(() => {
    return {
      colors: themeColors,
      axis: getChartAxisColors(theme),
      grid: getChartGridColors(theme),
      tooltip: getTooltipColors(theme),
      theme,
    };
  }, [theme]);

  return chartTheme;
}
