# Database Layer Documentation

This directory contains the database connection, repository pattern implementation, and query builder utilities for the CivicPulse AI backend.

## Architecture

The database layer follows the Repository Pattern with the following components:

- **connection.ts**: PostgreSQL connection pool singleton
- **BaseRepository.ts**: Abstract base class with common CRUD operations
- **queryBuilder.ts**: Helper functions for building SQL queries
- **repositories/**: Specific repository implementations for each entity

## Usage Examples

### Basic CRUD Operations

```typescript
import repositories from "./repositories";

// Create a sensor
const sensor = await repositories.sensor.create({
  name: "Waste Sensor #1",
  type: "WASTE",
  location: {
    type: "Point",
    coordinates: [-122.4194, 37.7749],
  },
  zoneId: "zone-123",
  config: {
    threshold: 80,
    interval: 300,
  },
});

// Find sensor by ID
const foundSensor = await repositories.sensor.findById(sensor.id);

// Update sensor
const updated = await repositories.sensor.update(sensor.id, {
  name: "Updated Sensor Name",
});

// Delete sensor
await repositories.sensor.delete(sensor.id);
```

### Querying with Conditions

```typescript
import { WhereCondition } from "./db/queryBuilder";

// Find active incidents
const activeIncidents = await repositories.incident.findAll(
  [{ field: "status", operator: "=", value: "ACTIVE" }],
  [{ field: "priority_score", direction: "DESC" }],
  { limit: 10 }
);

// Find sensors by type
const wasteSensors = await repositories.sensor.findByType("WASTE");

// Find incidents in a zone
const zoneIncidents = await repositories.incident.findByZone("zone-123");
```

### Transactions

```typescript
import db from "./db/connection";

// Execute multiple operations in a transaction
await db.transaction(async (client) => {
  // Create incident
  const incident = await repositories.incident.create(
    {
      type: "WASTE_OVERFLOW",
      category: "WASTE_OVERFLOW",
      severity: "HIGH",
      status: "ACTIVE",
      priorityScore: 85,
      confidence: 0.95,
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749],
      },
      zoneId: "zone-123",
      description: "Waste bin overflow detected",
      detectedAt: new Date(),
    },
    client
  );

  // Create work order for the incident
  const workOrder = await repositories.workOrder.create(
    {
      incidentId: incident.id,
      title: "Clean up waste overflow",
      description: "Urgent cleanup required",
      status: "CREATED",
      priority: "HIGH",
      location: incident.location,
      zoneId: incident.zoneId,
      estimatedDuration: 30,
    },
    client
  );

  // If any operation fails, the entire transaction will be rolled back
});
```

### Batch Operations

```typescript
// Batch insert sensor readings
const readings = [
  {
    sensorId: "sensor-1",
    timestamp: new Date(),
    value: 75.5,
    unit: "%",
  },
  {
    sensorId: "sensor-2",
    timestamp: new Date(),
    value: 82.3,
    unit: "%",
  },
];

await repositories.sensorReading.batchInsert(readings);
```

### Spatial Queries

```typescript
// Find sensors near a location (within 1000 meters)
const nearbySensors = await repositories.sensor.findNearby(
  -122.4194, // longitude
  37.7749, // latitude
  1000 // radius in meters
);

// Find zone containing a point
const zone = await repositories.zone.findContainingPoint(-122.4194, 37.7749);

// Find incidents near a location
const nearbyIncidents = await repositories.incident.findNearby(
  -122.4194,
  37.7749,
  500
);
```

### Statistics and Aggregations

```typescript
// Get sensor reading statistics
const stats = await repositories.sensorReading.getStatistics(
  "sensor-1",
  new Date("2024-01-01"),
  new Date("2024-01-31")
);
// Returns: { count, avg, min, max, stddev }

// Get incident counts by severity
const severityCounts = await repositories.incident.getCountsBySeverity();
// Returns: { LOW: 5, MEDIUM: 10, HIGH: 3, CRITICAL: 1 }

// Get work order counts by status
const statusCounts = await repositories.workOrder.getCountsByStatus();
// Returns: { CREATED: 2, ASSIGNED: 5, IN_PROGRESS: 3, COMPLETED: 20, CANCELLED: 1 }
```

### Custom Queries

```typescript
// Execute raw SQL queries when needed
const customResults = await repositories.sensor.query(
  `
  SELECT s.*, COUNT(sr.id) as reading_count
  FROM sensors s
  LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
  WHERE s.type = $1
  GROUP BY s.id
  HAVING COUNT(sr.id) > $2
`,
  ["WASTE", 100]
);
```

## Query Builder Helpers

The query builder provides utilities for constructing SQL queries programmatically:

```typescript
import {
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildWhereClause,
} from "./db/queryBuilder";

// Build a SELECT query
const { query, params } = buildSelectQuery(
  "sensors",
  ["id", "name", "type"],
  [
    { field: "type", operator: "=", value: "WASTE" },
    { field: "zone_id", operator: "=", value: "zone-123" },
  ],
  [{ field: "name", direction: "ASC" }],
  { limit: 10, offset: 0 }
);
```

## Connection Management

The database connection is managed through a singleton pool:

```typescript
import db from "./db/connection";

// Get the pool instance
const pool = db.getPool();

// Execute a query directly
const results = await db.query("SELECT * FROM sensors WHERE type = $1", [
  "WASTE",
]);

// Get a client for manual transaction control
const client = await db.getClient();
try {
  await client.query("BEGIN");
  // ... perform operations
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}

// Test connection
const isHealthy = await db.testConnection();

// Close all connections (for graceful shutdown)
await db.close();
```

## Best Practices

1. **Use Transactions for Multi-Step Operations**: Always wrap related database operations in transactions to ensure data consistency.

2. **Leverage Repository Methods**: Use the built-in repository methods instead of raw queries when possible for better maintainability.

3. **Pass Client for Transactions**: When executing operations within a transaction, always pass the client parameter to repository methods.

4. **Use Batch Operations**: For inserting multiple records, use batch insert methods for better performance.

5. **Handle Errors Gracefully**: All repository methods throw errors on failure. Always wrap database calls in try-catch blocks.

6. **Use Parameterized Queries**: Never concatenate user input into SQL queries. Always use parameterized queries to prevent SQL injection.

7. **Close Connections on Shutdown**: Ensure database connections are properly closed during application shutdown.

## Environment Variables

Required environment variables for database connection:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/civicpulse
```

The connection pool is configured with:

- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- SSL: Enabled in production

## Testing

When writing tests, you can use the repository pattern with a test database:

```typescript
import db from "./db/connection";
import repositories from "./repositories";

beforeAll(async () => {
  // Ensure test database is connected
  await db.testConnection();
});

afterAll(async () => {
  // Clean up connections
  await db.close();
});

test("should create and retrieve sensor", async () => {
  const sensor = await repositories.sensor.create({
    name: "Test Sensor",
    type: "WASTE",
    // ... other fields
  });

  const retrieved = await repositories.sensor.findById(sensor.id);
  expect(retrieved).toBeDefined();
  expect(retrieved?.name).toBe("Test Sensor");

  // Clean up
  await repositories.sensor.delete(sensor.id);
});
```
