import { io, Socket } from "socket.io-client";

const WS_URL = (import.meta as any).env.VITE_WS_URL || "http://localhost:4000";

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    const token = localStorage.getItem("auth_token");

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.reconnectAttempts++;

      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed after max attempts");
    });

    // Set up event forwarding
    this.socket.onAny((eventName: string, data: any) => {
      this.notifyHandlers(eventName, data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Cannot emit event, socket not connected");
    }
  }

  private notifyHandlers(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();

// Auto-connect on module load
if (typeof window !== "undefined") {
  wsClient.connect();
}

export default wsClient;
