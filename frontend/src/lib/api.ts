import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:4000";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }

    // Log error for debugging
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Sensors
  sensors: {
    getAll: () => api.get("/sensors"),
    getById: (id: string) => api.get(`/sensors/${id}`),
    getReadings: (id: string, params?: any) =>
      api.get(`/sensors/${id}/readings`, { params }),
    configure: (id: string, config: any) =>
      api.post(`/sensors/${id}/configure`, config),
  },

  // Incidents
  incidents: {
    getAll: (params?: any) => api.get("/incidents", { params }),
    getById: (id: string) => api.get(`/incidents/${id}`),
    create: (data: any) => api.post("/incidents", data),
    update: (id: string, data: any) => api.patch(`/incidents/${id}`, data),
    delete: (id: string) => api.delete(`/incidents/${id}`),
  },

  // Work Orders
  workOrders: {
    getAll: (params?: any) => api.get("/work-orders", { params }),
    getById: (id: string) => api.get(`/work-orders/${id}`),
    create: (data: any) => api.post("/work-orders", data),
    updateStatus: (id: string, status: string) =>
      api.patch(`/work-orders/${id}/status`, { status }),
  },

  // Predictions
  predictions: {
    getAll: (params?: any) => api.get("/predictions", { params }),
    getBySensor: (sensorId: string) => api.get(`/predictions/${sensorId}`),
    refresh: () => api.post("/predictions/refresh"),
  },

  // Agents
  agents: {
    processIncident: (incidentId: string) =>
      api.post("/agents/process-incident", { incidentId }),
    getLogs: (params?: any) => api.get("/agents/logs", { params }),
  },

  // Replay
  replay: {
    getTimeline: (params: any) => api.get("/replay/timeline", { params }),
    getSnapshot: (timestamp: string) =>
      api.get(`/replay/snapshot/${timestamp}`),
  },

  // Scenarios
  scenarios: {
    getAll: () => api.get("/scenarios"),
    trigger: (id: string) => api.post(`/scenarios/${id}/trigger`),
    stop: () => api.post("/scenarios/stop"),
  },

  // Auth
  auth: {
    login: (credentials: { username: string; password: string }) =>
      api.post("/auth/login", credentials),
    logout: () => api.post("/auth/logout"),
    me: () => api.get("/auth/me"),
  },
};

export default api;
