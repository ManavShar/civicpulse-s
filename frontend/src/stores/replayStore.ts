import { create } from "zustand";
import { TimelineEvent, SystemSnapshot } from "../types";

interface ReplayState {
  // Replay mode
  isReplayMode: boolean;
  isPlaying: boolean;
  playbackSpeed: number;

  // Timeline data
  events: TimelineEvent[];
  startTime: Date | null;
  endTime: Date | null;
  currentTime: Date | null;

  // Snapshot data
  currentSnapshot: SystemSnapshot | null;

  // Loading states
  isLoadingTimeline: boolean;
  isLoadingSnapshot: boolean;

  // Actions
  setReplayMode: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setTimeRange: (start: Date, end: Date) => void;
  setCurrentTime: (time: Date) => void;
  setEvents: (events: TimelineEvent[]) => void;
  setCurrentSnapshot: (snapshot: SystemSnapshot | null) => void;
  setLoadingTimeline: (loading: boolean) => void;
  setLoadingSnapshot: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  isReplayMode: false,
  isPlaying: false,
  playbackSpeed: 1,
  events: [],
  startTime: null,
  endTime: null,
  currentTime: null,
  currentSnapshot: null,
  isLoadingTimeline: false,
  isLoadingSnapshot: false,
};

export const useReplayStore = create<ReplayState>((set) => ({
  ...initialState,

  setReplayMode: (enabled) => set({ isReplayMode: enabled }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setTimeRange: (start, end) => set({ startTime: start, endTime: end }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setEvents: (events) => set({ events }),
  setCurrentSnapshot: (snapshot) => set({ currentSnapshot: snapshot }),
  setLoadingTimeline: (loading) => set({ isLoadingTimeline: loading }),
  setLoadingSnapshot: (loading) => set({ isLoadingSnapshot: loading }),
  reset: () => set(initialState),
}));
