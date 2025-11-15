import { create } from "zustand";
import { WorkOrder, WorkOrderStatus } from "@/types";

interface WorkOrderFilters {
  status?: WorkOrderStatus[];
  priority?: string[];
  zoneId?: string;
  assignedUnitId?: string;
}

interface WorkOrderState {
  workOrders: WorkOrder[];
  selectedWorkOrderId: string | null;
  filters: WorkOrderFilters;
  loading: boolean;
  error: string | null;

  // Actions
  setWorkOrders: (workOrders: WorkOrder[]) => void;
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  removeWorkOrder: (id: string) => void;
  setSelectedWorkOrder: (id: string | null) => void;
  setFilters: (filters: Partial<WorkOrderFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getFilteredWorkOrders: () => WorkOrder[];
  getSortedWorkOrders: () => WorkOrder[];
  getWorkOrderById: (id: string) => WorkOrder | undefined;
  getActiveWorkOrders: () => WorkOrder[];
  getWorkOrdersByIncident: (incidentId: string) => WorkOrder[];
}

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrders: [],
  selectedWorkOrderId: null,
  filters: {},
  loading: false,
  error: null,

  setWorkOrders: (workOrders) => set({ workOrders, error: null }),

  addWorkOrder: (workOrder) =>
    set((state) => ({
      workOrders: [...state.workOrders, workOrder],
    })),

  updateWorkOrder: (id, updates) =>
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, ...updates } : wo
      ),
    })),

  removeWorkOrder: (id) =>
    set((state) => ({
      workOrders: state.workOrders.filter((wo) => wo.id !== id),
    })),

  setSelectedWorkOrder: (id) => set({ selectedWorkOrderId: id }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getFilteredWorkOrders: () => {
    const { workOrders, filters } = get();
    let filtered = [...workOrders];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((wo) => filters.status!.includes(wo.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((wo) =>
        filters.priority!.includes(wo.priority)
      );
    }

    if (filters.zoneId) {
      filtered = filtered.filter((wo) => wo.zoneId === filters.zoneId);
    }

    if (filters.assignedUnitId) {
      filtered = filtered.filter(
        (wo) => wo.assignedUnitId === filters.assignedUnitId
      );
    }

    return filtered;
  },

  getSortedWorkOrders: () => {
    const filtered = get().getFilteredWorkOrders();

    // Sort by priority and creation time
    return filtered.sort((a, b) => {
      const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return (
        new Date(b.estimatedCompletion || 0).getTime() -
        new Date(a.estimatedCompletion || 0).getTime()
      );
    });
  },

  getWorkOrderById: (id) => get().workOrders.find((wo) => wo.id === id),

  getActiveWorkOrders: () =>
    get().workOrders.filter((wo) =>
      ["CREATED", "ASSIGNED", "IN_PROGRESS"].includes(wo.status)
    ),

  getWorkOrdersByIncident: (incidentId) =>
    get().workOrders.filter((wo) => wo.incidentId === incidentId),
}));
