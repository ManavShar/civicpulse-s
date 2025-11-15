import { create } from "zustand";

interface ActiveScenarioInfo {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  elapsedTime: number;
  remainingTime: number;
  triggeredIncidents: number;
}

interface ScenarioState {
  activeScenario: ActiveScenarioInfo | null;
  setActiveScenario: (scenario: ActiveScenarioInfo | null) => void;
  isScenarioActive: () => boolean;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  activeScenario: null,

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),

  isScenarioActive: () => get().activeScenario !== null,
}));
