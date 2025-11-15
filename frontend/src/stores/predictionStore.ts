import { create } from "zustand";
import { Prediction } from "@/types";

interface PredictionState {
  predictions: Prediction[];
  selectedPredictionId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setPredictions: (predictions: Prediction[]) => void;
  addPrediction: (prediction: Prediction) => void;
  updatePrediction: (id: string, updates: Partial<Prediction>) => void;
  removePrediction: (id: string) => void;
  setSelectedPrediction: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getPredictionById: (id: string) => Prediction | undefined;
  getPredictionsBySensor: (sensorId: string) => Prediction[];
  getHighConfidencePredictions: (threshold?: number) => Prediction[];
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  predictions: [],
  selectedPredictionId: null,
  loading: false,
  error: null,

  setPredictions: (predictions) => set({ predictions, error: null }),

  addPrediction: (prediction) =>
    set((state) => ({
      predictions: [...state.predictions, prediction],
    })),

  updatePrediction: (id, updates) =>
    set((state) => ({
      predictions: state.predictions.map((pred) =>
        pred.id === id ? { ...pred, ...updates } : pred
      ),
    })),

  removePrediction: (id) =>
    set((state) => ({
      predictions: state.predictions.filter((pred) => pred.id !== id),
    })),

  setSelectedPrediction: (id) => set({ selectedPredictionId: id }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getPredictionById: (id) => get().predictions.find((p) => p.id === id),

  getPredictionsBySensor: (sensorId) =>
    get().predictions.filter((p) => p.sensorId === sensorId),

  getHighConfidencePredictions: (threshold = 0.7) =>
    get().predictions.filter((p) => p.confidence >= threshold),
}));
