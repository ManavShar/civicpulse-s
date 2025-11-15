import { create } from "zustand";
import { SystemMetrics } from "@/types";

interface MetricsState {
  metrics: SystemMetrics | null;
  history: SystemMetrics[];
  loading: boolean;
  error: string | null;

  // Actions
  setMetrics: (metrics: SystemMetrics) => void;
  addToHistory: (metrics: SystemMetrics) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getMetricsTrend: (key: keyof SystemMetrics, limit?: number) => number[];
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: null,
  history: [],
  loading: false,
  error: null,

  setMetrics: (metrics) =>
    set((state) => ({
      metrics,
      history: [...state.history, metrics].slice(-100), // Keep last 100 entries
      error: null,
    })),

  addToHistory: (metrics) =>
    set((state) => ({
      history: [...state.history, metrics].slice(-100),
    })),

  clearHistory: () => set({ history: [] }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getMetricsTrend: (key, limit = 20) => {
    const history = get().history.slice(-limit);
    return history.map((m) => {
      const value = m[key];
      return typeof value === "number" ? value : 0;
    });
  },
}));
