# WebSocket Service Documentation

## Overview

The WebSocket service provides real-time bidirectional communication between the backend and frontend clients using Socket.io. It enables instant updates for sensor readings, incidents, work orders, agent messages, and system metrics.

## Architecture

### Components

1. **WebSocketService** - Core service managing Socket.io server and connections
2. **Type Definitions** - TypeScript interfaces for all WebSocket events
3. **Utility Functions** - Helper functions for emitting events throughout the application

### Connection Flow

```
Client → Connect → Authentication Middleware → Connection Handler → Event Subscriptions
                                                        ↓
                                            Store in connectedClients Map
                                                        ↓
                                            Setup Event Listeners (subscribe, unsubscribe, ping)
                                                        ↓
                                            Send Initial System Metrics
```

## Event Types

### Sensor Events

- `sensor:reading` - New sensor reading available
- `sensor:anomaly` - Anomaly detected in sensor data

### Incident Events

- `incident:created` - New incident detected
- `incident:updated` - Incident status or details changed
- `incident:resolved` - Incident marked as resolved

### Work Order Events

- `workorder:created` - New work order created
- `workorder:updated` - Work order details changed
- `workorder:assigned` - Work order assigned to unit
- `workorder:started` - Work order work started
- `workorder:completed` - Work order completed

### Agent Events

- `agent:message` - Agent log message
- `agent:plan_created` - Planner agent created action plan
- `agent:dispatched` - Dispatcher agent created work orders
- `agent:explained` - Analyst agent provided explanation

### System Events

- `system:metrics` - System-wide metrics update
- `scenario:triggered` - Demonstration scenario activated
- `scenario:stopped` - Demonstration scenario stopped

## Usage

### Initializing the Service

The WebSocket service is automatically initialized when the server starts:

```typescript
import { createServer } from "http";
import { initializeWebSocketService } from "./services";

const app = createApp();
const httpServer = createServer(app);
const wsService = initializeWebSocketService(httpServer);
```

### Emitting Events

Use the utility functions to emit events from anywhere in the application:

```typescript
import {
  emitSensorReading,
  emitIncidentCreated,
  emitWorkOrderUpdated,
} from "../utils/websocket";

// Emit sensor reading
emitSensorReading({
  id: "reading-123",
  sensorId: "sensor-1",
  timestamp: new Date(),
  value: 75.5,
  unit: "°F",
  createdAt: new Date(),
});

// Emit incident created
emitIncidentCreated(incident);

// Emit work order updated
emitWorkOrderUpdated(workOrder);
```

### Broadcasting to Specific Rooms

Events can be broadcast to specific rooms (e.g., zone-specific updates):

```typescript
const wsService = getWebSocketService();
wsService.broadcastToRoom(`zone:${zoneId}`, "incident:created", incident);
```

## Client-Side Integration

### Connecting to WebSocket

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  transports: ["websocket", "polling"],
  auth: {
    token: "your-jwt-token", // Optional for authentication
  },
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server");
});
```

### Subscribing to Events

```typescript
// Listen for sensor readings
socket.on("sensor:reading", (reading) => {
  console.log("New sensor reading:", reading);
  updateSensorDisplay(reading);
});

// Listen for incidents
socket.on("incident:created", (incident) => {
  console.log("New incident:", incident);
  addIncidentToList(incident);
});

// Listen for work orders
socket.on("workorder:updated", (workOrder) => {
  console.log("Work order updated:", workOrder);
  updateWorkOrderStatus(workOrder);
});

// Listen for agent messages
socket.on("agent:message", (message) => {
  console.log("Agent message:", message);
  displayAgentMessage(message);
});
```

### Channel Subscriptions

Clients can subscribe to specific channels for filtered updates:

```typescript
// Subscribe to specific zones
socket.emit("subscribe", ["zone:downtown", "zone:riverside"]);

// Unsubscribe from channels
socket.emit("unsubscribe", ["zone:downtown"]);
```

### Heartbeat/Ping

Clients can send ping messages to check connection health:

```typescript
socket.emit("ping");

socket.on("pong", () => {
  console.log("Server responded to ping");
});
```

## Connection Management

### Reconnection

Socket.io automatically handles reconnection with exponential backoff:

```typescript
const socket = io("http://localhost:3001", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_error", (error) => {
  console.error("Reconnection error:", error);
});
```

### Connection Monitoring

```typescript
const wsService = getWebSocketService();

// Get connection count
const count = wsService.getConnectionCount();

// Get all connected socket IDs
const socketIds = wsService.getConnectedSocketIds();

// Check if specific socket is connected
const isConnected = wsService.isSocketConnected(socketId);

// Disconnect specific socket
wsService.disconnectSocket(socketId, "Admin action");

// Disconnect all sockets
wsService.disconnectAll("Server maintenance");
```

## Authentication

The WebSocket service includes authentication middleware that can verify JWT tokens:

```typescript
// In WebSocketService.ts
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (token) {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
  }

  next();
});
```

For demo purposes, authentication is optional. In production, you should enforce authentication for all connections.

## Performance Considerations

### Message Throttling

For high-frequency events like sensor readings, consider throttling on the client side:

```typescript
import { throttle } from "lodash";

const throttledUpdate = throttle((reading) => {
  updateSensorDisplay(reading);
}, 100); // Update at most every 100ms

socket.on("sensor:reading", throttledUpdate);
```

### Batch Updates

For multiple updates, consider batching them:

```typescript
const updates = [];
const flushInterval = 100; // ms

socket.on("sensor:reading", (reading) => {
  updates.push(reading);
});

setInterval(() => {
  if (updates.length > 0) {
    processBatchUpdates(updates);
    updates.length = 0;
  }
}, flushInterval);
```

### Room-Based Broadcasting

Use rooms to limit broadcast scope and reduce unnecessary network traffic:

```typescript
// Server-side: Broadcast only to relevant zones
wsService.broadcastToRoom(
  `zone:${incident.zoneId}`,
  "incident:created",
  incident
);

// Client-side: Subscribe only to relevant zones
socket.emit("subscribe", ["zone:downtown"]);
```

## Error Handling

### Server-Side

```typescript
socket.on("error", (error) => {
  logger.error("WebSocket error", {
    socketId: socket.id,
    error: error.message,
  });

  // Emit error to client
  socket.emit("error", {
    code: "WEBSOCKET_ERROR",
    message: "An error occurred",
  });
});
```

### Client-Side

```typescript
socket.on("error", (error) => {
  console.error("WebSocket error:", error);
  showErrorNotification(error.message);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  showConnectionError();
});
```

## Testing

### Unit Tests

```typescript
import { createServer } from "http";
import { initializeWebSocketService } from "./WebSocketService";

describe("WebSocketService", () => {
  let httpServer;
  let wsService;

  beforeEach(() => {
    httpServer = createServer();
    wsService = initializeWebSocketService(httpServer);
  });

  afterEach(async () => {
    await wsService.close();
  });

  it("should initialize successfully", () => {
    expect(wsService).toBeDefined();
    expect(wsService.getConnectionCount()).toBe(0);
  });
});
```

### Integration Tests

```typescript
import { io } from "socket.io-client";

describe("WebSocket Integration", () => {
  it("should broadcast sensor readings", (done) => {
    const client = io("http://localhost:3001");

    client.on("sensor:reading", (data) => {
      expect(data.sensorId).toBeDefined();
      expect(data.value).toBeTypeOf("number");
      client.disconnect();
      done();
    });

    // Trigger sensor reading emission
    emitSensorReading(mockReading);
  });
});
```

## Monitoring

### Metrics

Track WebSocket metrics for monitoring:

```typescript
// Connection metrics
const connectionCount = wsService.getConnectionCount();
const connectedSockets = wsService.getConnectedSocketIds();

// Event metrics (implement custom tracking)
let eventCounts = {
  "sensor:reading": 0,
  "incident:created": 0,
  "workorder:updated": 0,
};

// Increment on each emission
function trackEvent(eventType: string) {
  eventCounts[eventType]++;
}
```

### Logging

All WebSocket events are logged with structured logging:

```typescript
logger.info("Client connected", {
  socketId,
  totalConnections: this.connectedClients.size,
  transport: socket.conn.transport.name,
});

logger.debug("Broadcasting event", {
  event,
  clientCount: this.connectedClients.size,
});
```

## Security Best Practices

1. **Enable Authentication** - Verify JWT tokens for all connections in production
2. **Rate Limiting** - Implement rate limiting for event emissions
3. **Input Validation** - Validate all incoming messages
4. **CORS Configuration** - Restrict CORS origins in production
5. **Transport Security** - Use WSS (WebSocket Secure) in production
6. **Message Size Limits** - Enforce maximum message size
7. **Connection Limits** - Limit connections per IP address

## Troubleshooting

### Connection Issues

```typescript
// Check if WebSocket service is initialized
try {
  const wsService = getWebSocketService();
  console.log("WebSocket service is running");
} catch (error) {
  console.error("WebSocket service not initialized");
}

// Check connection count
const count = wsService.getConnectionCount();
if (count === 0) {
  console.warn("No clients connected");
}
```

### Event Not Received

1. Check if client is connected: `socket.connected`
2. Verify event name matches exactly
3. Check if client is subscribed to the correct room
4. Review server logs for emission errors
5. Verify network connectivity

### High Latency

1. Check network conditions
2. Reduce message frequency with throttling
3. Use room-based broadcasting to reduce traffic
4. Enable compression for large payloads
5. Monitor server resource usage

## Future Enhancements

- [ ] Add Redis adapter for horizontal scaling
- [ ] Implement message queuing for offline clients
- [ ] Add message persistence and replay
- [ ] Implement custom authentication strategies
- [ ] Add WebSocket metrics dashboard
- [ ] Implement automatic reconnection with state recovery
- [ ] Add support for binary data transmission
- [ ] Implement message compression
