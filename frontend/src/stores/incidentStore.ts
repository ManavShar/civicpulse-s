import { create } from "zustand";
import { Incident, IncidentStatus, Severity } from "@/types";

interface IncidentFilters {
  status?: IncidentStatus[];
  severity?: Severity[];
  zoneId?: string;
  category?: string[];
}

interface IncidentState {
  incidents: Incident[];
  selectedIncidentId: string | null;
  filters: IncidentFilters;
  sortBy: "priority" | "time" | "severity";
  sortOrder: "asc" | "desc";
  loading: boolean;
  error: string | null;

  // Actions
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  removeIncident: (id: string) => void;
  setSelectedIncident: (id: string | null) => void;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: "priority" | "time" | "severity") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getFilteredIncidents: () => Incident[];
  getSortedIncidents: () => Incident[];
  getIncidentById: (id: string) => Incident | undefined;
  getActiveIncidents: () => Incident[];
  getCriticalIncidents: () => Incident[];
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  selectedIncidentId: null,
  filters: {},
  sortBy: "priority",
  sortOrder: "desc",
  loading: false,
  error: null,

  setIncidents: (incidents) => set({ incidents, error: null }),

  addIncident: (incident) =>
    set((state) => ({
      incidents: Array.isArray(state.incidents)
        ? [...state.incidents, incident]
        : [incident],
    })),

  updateIncident: (id, updates) =>
    set((state) => ({
      incidents: Array.isArray(state.incidents)
        ? state.incidents.map((incident) =>
            incident.id === id ? { ...incident, ...updates } : incident
          )
        : [],
    })),

  removeIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.filter((incident) => incident.id !== id),
    })),

  setSelectedIncident: (id) => set({ selectedIncidentId: id }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setSortBy: (sortBy) => set({ sortBy }),

  setSortOrder: (order) => set({ sortOrder: order }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getFilteredIncidents: () => {
    const { incidents, filters } = get();

    // Safety check: ensure incidents is an array
    if (!Array.isArray(incidents)) return [];

    let filtered = [...incidents];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((i) => filters.status!.includes(i.status));
    }

    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter((i) => filters.severity!.includes(i.severity));
    }

    if (filters.zoneId) {
      filtered = filtered.filter((i) => i.zoneId === filters.zoneId);
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((i) => filters.category!.includes(i.category));
    }

    return filtered;
  },

  getSortedIncidents: () => {
    const { sortBy, sortOrder } = get();
    const filtered = get().getFilteredIncidents();

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "priority":
          comparison = a.priorityScore - b.priorityScore;
          break;
        case "time":
          comparison =
            new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
          break;
        case "severity":
          const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  },

  getIncidentById: (id) => {
    const incidents = get().incidents;
    return Array.isArray(incidents)
      ? incidents.find((i) => i.id === id)
      : undefined;
  },

  getActiveIncidents: () => {
    const incidents = get().incidents;
    return Array.isArray(incidents)
      ? incidents.filter((i) => i.status === "ACTIVE")
      : [];
  },

  getCriticalIncidents: () => {
    const incidents = get().incidents;
    return Array.isArray(incidents)
      ? incidents.filter(
          (i) => i.severity === "CRITICAL" && i.status === "ACTIVE"
        )
      : [];
  },
}));
