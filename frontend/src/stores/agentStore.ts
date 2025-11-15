import { create } from "zustand";
import { AgentMessage, AgentType } from "@/types";

interface AgentState {
  messages: AgentMessage[];
  selectedMessageId: string | null;
  filterByAgent: AgentType | null;
  loading: boolean;
  error: string | null;

  // Actions
  setMessages: (messages: AgentMessage[]) => void;
  addMessage: (message: AgentMessage) => void;
  updateMessage: (id: string, updates: Partial<AgentMessage>) => void;
  removeMessage: (id: string) => void;
  setSelectedMessage: (id: string | null) => void;
  setFilterByAgent: (agentType: AgentType | null) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getFilteredMessages: () => AgentMessage[];
  getMessageById: (id: string) => AgentMessage | undefined;
  getMessagesByAgent: (agentType: AgentType) => AgentMessage[];
  getMessagesByIncident: (incidentId: string) => AgentMessage[];
  getRecentMessages: (limit?: number) => AgentMessage[];
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  selectedMessageId: null,
  filterByAgent: null,
  loading: false,
  error: null,

  setMessages: (messages) => set({ messages, error: null }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setSelectedMessage: (id) => set({ selectedMessageId: id }),

  setFilterByAgent: (agentType) => set({ filterByAgent: agentType }),

  clearMessages: () => set({ messages: [] }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getFilteredMessages: () => {
    const { messages, filterByAgent } = get();

    if (!filterByAgent) return messages;

    return messages.filter((msg) => msg.agentType === filterByAgent);
  },

  getMessageById: (id) => get().messages.find((msg) => msg.id === id),

  getMessagesByAgent: (agentType) =>
    get().messages.filter((msg) => msg.agentType === agentType),

  getMessagesByIncident: (incidentId) =>
    get().messages.filter((msg) => msg.incidentId === incidentId),

  getRecentMessages: (limit = 50) => {
    const messages = [...get().messages];
    return messages
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  },
}));
