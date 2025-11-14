/**
 * WebSocket Service for real-time communication
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import logger from "../utils/logger";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/websocket";

/**
 * WebSocket Service managing Socket.io connections and events
 */
export class WebSocketService {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.io server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();

    logger.info("WebSocket service initialized");
  }

  /**
   * Set up Socket.io middleware
   */
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        // Extract token from auth header or query
        const token =
          socket.handshake.auth.token || socket.handshake.query.token;

        // For demo purposes, we'll allow connections without authentication
        // In production, verify JWT token here
        if (token) {
          // TODO: Verify JWT token and extract user info
          // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
          // socket.data.userId = decoded.userId;
          // socket.data.role = decoded.role;
        }

        socket.data.connectedAt = new Date();
        socket.data.subscriptions = new Set();

        next();
      } catch (error) {
        logger.error("WebSocket authentication error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        next(new Error("Authentication failed"));
      }
    });

    // Logging middleware
    this.io.use((socket, next) => {
      logger.info("WebSocket connection attempt", {
        socketId: socket.id,
        transport: socket.conn.transport.name,
        remoteAddress: socket.handshake.address,
      });
      next();
    });
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: Socket): void {
    const socketId = socket.id;
    this.connectedClients.set(socketId, socket);

    logger.info("Client connected", {
      socketId,
      totalConnections: this.connectedClients.size,
      transport: socket.conn.transport.name,
    });

    // Handle subscription requests
    socket.on("subscribe", (channels: string[]) => {
      this.handleSubscribe(socket, channels);
    });

    // Handle unsubscription requests
    socket.on("unsubscribe", (channels: string[]) => {
      this.handleUnsubscribe(socket, channels);
    });

    // Handle ping for heartbeat
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      this.handleDisconnect(socket, reason);
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("WebSocket error", {
        socketId,
        error: error.message,
      });
    });

    // Send initial connection success message
    this.emitToSocket(socket, "system:metrics", {
      activeIncidents: 0,
      criticalIncidents: 0,
      activePredictions: 0,
      activeWorkOrders: 0,
      overallRiskLevel: 0,
      zoneStatus: {
        healthy: 0,
        warning: 0,
        critical: 0,
      },
    });
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(socket: Socket, channels: string[]): void {
    channels.forEach((channel) => {
      socket.join(channel);
      socket.data.subscriptions.add(channel);
    });

    logger.debug("Client subscribed to channels", {
      socketId: socket.id,
      channels,
      totalSubscriptions: socket.data.subscriptions.size,
    });
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(socket: Socket, channels: string[]): void {
    channels.forEach((channel) => {
      socket.leave(channel);
      socket.data.subscriptions.delete(channel);
    });

    logger.debug("Client unsubscribed from channels", {
      socketId: socket.id,
      channels,
      totalSubscriptions: socket.data.subscriptions.size,
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    this.connectedClients.delete(socket.id);

    logger.info("Client disconnected", {
      socketId: socket.id,
      reason,
      totalConnections: this.connectedClients.size,
      connectionDuration: Date.now() - socket.data.connectedAt.getTime() + "ms",
    });
  }

  /**
   * Emit event to all connected clients
   */
  public broadcast(event: string, data: any): void {
    (this.io as any).emit(event, data);

    logger.debug("Broadcasting event", {
      event,
      clientCount: this.connectedClients.size,
    });
  }

  /**
   * Emit event to specific room/channel
   */
  public broadcastToRoom(room: string, event: string, data: any): void {
    (this.io.to(room) as any).emit(event, data);

    logger.debug("Broadcasting event to room", {
      event,
      room,
    });
  }

  /**
   * Emit event to specific socket
   */
  public emitToSocket(socket: Socket, event: string, data: any): void {
    socket.emit(event, data);
  }

  /**
   * Emit event to specific socket by ID
   */
  public emitToSocketId(socketId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      this.emitToSocket(socket, event, data);
    } else {
      logger.warn("Attempted to emit to non-existent socket", {
        socketId,
        event,
      });
    }
  }

  /**
   * Get number of connected clients
   */
  public getConnectionCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get all connected socket IDs
   */
  public getConnectedSocketIds(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  /**
   * Check if a socket is connected
   */
  public isSocketConnected(socketId: string): boolean {
    return this.connectedClients.has(socketId);
  }

  /**
   * Disconnect a specific socket
   */
  public disconnectSocket(socketId: string, reason?: string): void {
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.disconnect(true);
      logger.info("Socket disconnected by server", {
        socketId,
        reason,
      });
    }
  }

  /**
   * Disconnect all sockets
   */
  public disconnectAll(reason?: string): void {
    this.io.disconnectSockets(true);
    this.connectedClients.clear();
    logger.info("All sockets disconnected", {
      reason,
    });
  }

  /**
   * Get Socket.io server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Broadcast incident event
   */
  public broadcastIncident(
    action: "created" | "updated" | "resolved",
    incident: any
  ): void {
    const event = `incident:${action}`;
    this.broadcast(event, incident);
    logger.debug(`Broadcasted incident ${action}`, {
      incidentId: incident.id,
      event,
    });
  }

  /**
   * Broadcast predictions
   */
  public broadcastPredictions(predictions: any[]): void {
    this.broadcast("predictions:updated", predictions);
    logger.debug("Broadcasted predictions", {
      count: predictions.length,
    });
  }

  /**
   * Broadcast work order event
   */
  public broadcastWorkOrder(
    action: "created" | "updated" | "completed",
    workOrder: any
  ): void {
    const event = `workorder:${action}`;
    this.broadcast(event, workOrder);
    logger.debug(`Broadcasted work order ${action}`, {
      workOrderId: workOrder.id,
      event,
    });
  }

  /**
   * Broadcast agent message
   */
  public broadcastAgentMessage(message: any): void {
    this.broadcast("agent:message", message);
    logger.debug("Broadcasted agent message", {
      agentType: message.agent_type,
    });
  }

  /**
   * Close the WebSocket server
   */
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        logger.info("WebSocket server closed");
        resolve();
      });
    });
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

/**
 * Initialize WebSocket service
 */
export function initializeWebSocketService(
  httpServer: HTTPServer
): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(httpServer);
  }
  return webSocketServiceInstance;
}

/**
 * Get WebSocket service instance
 */
export function getWebSocketService(): WebSocketService {
  if (!webSocketServiceInstance) {
    throw new Error(
      "WebSocket service not initialized. Call initializeWebSocketService first."
    );
  }
  return webSocketServiceInstance;
}
