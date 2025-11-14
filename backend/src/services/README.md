# CacheService Usage Guide

The CacheService provides a comprehensive interface for Redis caching and pub/sub operations.

## Basic Usage

### Import the Service

```typescript
import { cacheService, CachePrefix, CacheTTL } from "./services";
```

### Get and Set Operations

```typescript
// Set a value with TTL
const key = cacheService.generateKey(CachePrefix.SENSOR, sensorId);
await cacheService.set(key, sensorData, CacheTTL.MEDIUM);

// Get a value
const data = await cacheService.get<Sensor>(key);

// Get or compute pattern
const sensor = await cacheService.getOrSet(
  key,
  async () => {
    // Fetch from database if not in cache
    return await sensorRepository.findById(sensorId);
  },
  CacheTTL.MEDIUM
);
```

### Invalidation

```typescript
// Invalidate a specific key
await cacheService.invalidate(key);

// Invalidate all keys matching a pattern
await cacheService.invalidatePattern(`${CachePrefix.SENSOR}:*`);
```

### Multiple Operations

```typescript
// Get multiple values
const keys = sensorIds.map((id) =>
  cacheService.generateKey(CachePrefix.SENSOR, id)
);
const sensors = await cacheService.mget<Sensor>(keys);

// Set multiple values
const entries = {
  [key1]: value1,
  [key2]: value2,
};
await cacheService.mset(entries, CacheTTL.MEDIUM);
```

## Pub/Sub Operations

### Publishing Messages

```typescript
// Publish a message to a channel
await cacheService.publish("sensor:reading", {
  sensorId: "sensor-123",
  value: 42,
  timestamp: new Date(),
});
```

### Subscribing to Channels

```typescript
// Subscribe to a single channel
await cacheService.subscribe("sensor:reading", (message) => {
  console.log("Received sensor reading:", message);
  // Broadcast to WebSocket clients
  io.emit("sensor:reading", message);
});

// Subscribe to multiple channels
await cacheService.subscribeMultiple(
  ["sensor:reading", "incident:created", "workorder:updated"],
  (channel, message) => {
    console.log(`Message on ${channel}:`, message);
    // Handle based on channel
  }
);

// Pattern-based subscription
await cacheService.psubscribe("sensor:*", (channel, message) => {
  console.log(`Sensor event on ${channel}:`, message);
});
```

## Cache Key Naming Conventions

Use the predefined prefixes for consistency:

- `CachePrefix.SENSOR` - Sensor metadata
- `CachePrefix.SENSOR_READING` - Individual sensor readings
- `CachePrefix.INCIDENT` - Incident data
- `CachePrefix.PREDICTION` - Prediction data
- `CachePrefix.WORK_ORDER` - Work order data
- `CachePrefix.ZONE` - Zone data
- `CachePrefix.METRICS` - System metrics
- `CachePrefix.BASELINE` - Baseline statistics for anomaly detection
- `CachePrefix.SESSION` - User session data

### Key Format

Keys follow the pattern: `prefix:identifier[:subkey]`

Examples:

```typescript
// Sensor metadata
cacheService.generateKey(CachePrefix.SENSOR, "sensor-123");
// Result: "sensor:sensor-123"

// Sensor reading
cacheService.generateKey(CachePrefix.SENSOR_READING, "sensor-123", "latest");
// Result: "sensor:reading:sensor-123:latest"

// Baseline statistics
cacheService.generateKey(CachePrefix.BASELINE, "sensor-123");
// Result: "baseline:sensor-123"
```

## TTL Strategies

Use predefined TTL values for consistency:

- `CacheTTL.SHORT` (60s) - Rapidly changing data (sensor readings)
- `CacheTTL.MEDIUM` (5min) - Moderately changing data (incidents, work orders)
- `CacheTTL.LONG` (30min) - Slowly changing data (predictions)
- `CacheTTL.HOUR` (1h) - Relatively static data (sensor metadata, zones)
- `CacheTTL.DAY` (24h) - Very static data (configuration)
- `CacheTTL.WEEK` (7d) - Historical data

## Common Patterns

### Caching Database Queries

```typescript
async function getSensor(sensorId: string): Promise<Sensor> {
  const key = cacheService.generateKey(CachePrefix.SENSOR, sensorId);

  return await cacheService.getOrSet(
    key,
    async () => {
      // Fetch from database
      const sensor = await sensorRepository.findById(sensorId);
      if (!sensor) {
        throw new Error("Sensor not found");
      }
      return sensor;
    },
    CacheTTL.HOUR
  );
}
```

### Caching Baseline Statistics

```typescript
async function getBaseline(sensorId: string): Promise<BaselineStats> {
  const key = cacheService.generateKey(CachePrefix.BASELINE, sensorId);

  return await cacheService.getOrSet(
    key,
    async () => {
      // Calculate from historical data
      const readings = await getRecentReadings(sensorId, 1000);
      return calculateBaseline(readings);
    },
    CacheTTL.LONG
  );
}
```

### Invalidating Related Data

```typescript
async function updateSensor(sensorId: string, updates: Partial<Sensor>) {
  // Update in database
  await sensorRepository.update(sensorId, updates);

  // Invalidate cache
  const key = cacheService.generateKey(CachePrefix.SENSOR, sensorId);
  await cacheService.invalidate(key);

  // Invalidate related caches
  await cacheService.invalidatePattern(
    `${CachePrefix.SENSOR_READING}:${sensorId}:*`
  );
}
```

### Real-time Event Broadcasting

```typescript
// In sensor service
async function processSensorReading(reading: SensorReading) {
  // Store in database
  await sensorReadingRepository.create(reading);

  // Cache latest reading
  const key = cacheService.generateKey(
    CachePrefix.SENSOR_READING,
    reading.sensorId,
    "latest"
  );
  await cacheService.set(key, reading, CacheTTL.SHORT);

  // Broadcast to subscribers
  await cacheService.publish("sensor:reading", reading);
}

// In WebSocket handler
await cacheService.subscribe("sensor:reading", (reading) => {
  // Broadcast to all connected WebSocket clients
  io.emit("sensor:reading", reading);
});
```

## Error Handling

The CacheService handles errors gracefully:

- Failed cache reads return `null` instead of throwing
- Failed cache writes return `false` instead of throwing
- All errors are logged automatically
- Your application continues to work even if Redis is unavailable

```typescript
// Safe to use without try-catch
const data = await cacheService.get(key);
if (data === null) {
  // Cache miss or error - fetch from database
  data = await fetchFromDatabase();
}
```

## Performance Tips

1. **Use appropriate TTLs** - Don't cache data longer than necessary
2. **Batch operations** - Use `mget` and `mset` for multiple keys
3. **Pattern invalidation** - Be careful with wildcards, they can be slow
4. **Pub/Sub** - Use dedicated channels for different event types
5. **Key naming** - Keep keys short but descriptive

## Testing

When testing, you can flush the cache:

```typescript
// Clear all cache (use only in tests!)
await cacheService.flushAll();
```
