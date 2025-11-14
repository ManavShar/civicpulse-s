# CivicPulse AI - Database Documentation

## Overview

CivicPulse AI uses PostgreSQL with PostGIS extension for storing and querying geographic data. The database schema supports real-time sensor data, incident management, predictive analytics, work orders, and AI agent logs.

## Database Schema

### Tables

#### zones

Geographic subdivisions of the city for operational management.

- `id` (UUID): Primary key
- `name` (VARCHAR): Zone name
- `type` (VARCHAR): Zone type (RESIDENTIAL, COMMERCIAL, INDUSTRIAL, PARK)
- `boundary` (GEOGRAPHY): Polygon boundary using PostGIS
- `population` (INTEGER): Estimated population
- `metadata` (JSONB): Additional zone information
- `created_at` (TIMESTAMP): Creation timestamp

**Indexes:**

- `idx_zones_boundary`: GIST index on boundary for spatial queries

#### sensors

IoT sensors monitoring city infrastructure.

- `id` (UUID): Primary key
- `name` (VARCHAR): Sensor name
- `type` (VARCHAR): Sensor type (WASTE, LIGHT, WATER, TRAFFIC, ENVIRONMENT, NOISE)
- `location` (GEOGRAPHY): Point location using PostGIS
- `zone_id` (UUID): Foreign key to zones
- `metadata` (JSONB): Sensor metadata
- `config` (JSONB): Sensor configuration (baseValue, unit, interval, anomalyProbability)
- `status` (VARCHAR): Sensor status (online, offline, warning)
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes:**

- `idx_sensors_zone`: Index on zone_id
- `idx_sensors_type`: Index on type
- `idx_sensors_location`: GIST index on location
- `idx_sensors_status`: Index on status

#### sensor_readings

Time-series data from sensors.

- `id` (BIGSERIAL): Primary key
- `sensor_id` (UUID): Foreign key to sensors
- `timestamp` (TIMESTAMP): Reading timestamp
- `value` (NUMERIC): Sensor value
- `unit` (VARCHAR): Unit of measurement
- `metadata` (JSONB): Additional reading data
- `created_at` (TIMESTAMP): Creation timestamp

**Indexes:**

- `idx_readings_sensor_time`: Composite index on (sensor_id, timestamp DESC) for time-series queries
- `idx_readings_timestamp`: Index on timestamp for time-range queries

#### incidents

Detected infrastructure problems.

- `id` (UUID): Primary key
- `type` (VARCHAR): Incident type
- `category` (VARCHAR): Incident category
- `severity` (VARCHAR): Severity level (LOW, MEDIUM, HIGH, CRITICAL)
- `status` (VARCHAR): Status (ACTIVE, RESOLVED, DISMISSED)
- `priority_score` (INTEGER): Calculated priority (0-100)
- `confidence` (NUMERIC): Detection confidence (0.00-1.00)
- `location` (GEOGRAPHY): Point location
- `zone_id` (UUID): Foreign key to zones
- `sensor_id` (UUID): Foreign key to sensors
- `description` (TEXT): Incident description
- `metadata` (JSONB): Additional incident data
- `scoring_breakdown` (JSONB): Priority scoring factors
- `detected_at` (TIMESTAMP): Detection timestamp
- `resolved_at` (TIMESTAMP): Resolution timestamp
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes:**

- `idx_incidents_status`: Index on status
- `idx_incidents_priority`: Index on priority_score DESC
- `idx_incidents_zone`: Index on zone_id
- `idx_incidents_detected`: Index on detected_at DESC
- `idx_incidents_severity`: Index on severity
- `idx_incidents_location`: GIST index on location

#### predictions

ML-generated forecasts for sensor values.

- `id` (UUID): Primary key
- `sensor_id` (UUID): Foreign key to sensors
- `predicted_timestamp` (TIMESTAMP): Forecast timestamp
- `predicted_value` (NUMERIC): Predicted value
- `confidence` (NUMERIC): Prediction confidence (0.00-1.00)
- `lower_bound` (NUMERIC): Lower confidence bound
- `upper_bound` (NUMERIC): Upper confidence bound
- `model_version` (VARCHAR): ML model version
- `created_at` (TIMESTAMP): Creation timestamp

**Indexes:**

- `idx_predictions_sensor`: Index on sensor_id
- `idx_predictions_timestamp`: Index on predicted_timestamp
- `idx_predictions_confidence`: Index on confidence DESC

#### work_orders

Maintenance tasks assigned to field units.

- `id` (UUID): Primary key
- `incident_id` (UUID): Foreign key to incidents
- `title` (VARCHAR): Work order title
- `description` (TEXT): Detailed description
- `status` (VARCHAR): Status (CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority` (VARCHAR): Priority level (LOW, MEDIUM, HIGH, CRITICAL)
- `assigned_unit_id` (VARCHAR): Assigned field unit ID
- `location` (GEOGRAPHY): Point location
- `zone_id` (UUID): Foreign key to zones
- `estimated_duration` (INTEGER): Estimated duration in minutes
- `estimated_completion` (TIMESTAMP): Estimated completion time
- `started_at` (TIMESTAMP): Start timestamp
- `completed_at` (TIMESTAMP): Completion timestamp
- `metadata` (JSONB): Additional work order data
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes:**

- `idx_workorders_status`: Index on status
- `idx_workorders_incident`: Index on incident_id
- `idx_workorders_zone`: Index on zone_id
- `idx_workorders_priority`: Index on priority
- `idx_workorders_assigned_unit`: Index on assigned_unit_id
- `idx_workorders_created`: Index on created_at DESC

#### agent_logs

AI agent reasoning and decision logs.

- `id` (BIGSERIAL): Primary key
- `agent_type` (VARCHAR): Agent type (PLANNER, DISPATCHER, ANALYST)
- `step` (VARCHAR): Processing step
- `incident_id` (UUID): Foreign key to incidents
- `work_order_id` (UUID): Foreign key to work_orders
- `data` (JSONB): Agent reasoning data
- `timestamp` (TIMESTAMP): Log timestamp

**Indexes:**

- `idx_agent_logs_type`: Index on agent_type
- `idx_agent_logs_timestamp`: Index on timestamp DESC
- `idx_agent_logs_incident`: Index on incident_id
- `idx_agent_logs_work_order`: Index on work_order_id

#### users

System users for authentication.

- `id` (UUID): Primary key
- `username` (VARCHAR): Unique username
- `email` (VARCHAR): Unique email
- `password_hash` (VARCHAR): Bcrypt password hash
- `role` (VARCHAR): User role (ADMIN, OPERATOR, VIEWER)
- `metadata` (JSONB): Additional user data
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes:**

- `idx_users_username`: Index on username
- `idx_users_email`: Index on email
- `idx_users_role`: Index on role

## Setup Instructions

### Prerequisites

- PostgreSQL 15+ with PostGIS extension
- Node.js 18+
- npm or yarn

### Initial Setup

1. **Create Database:**

   ```bash
   createdb civicpulse
   ```

2. **Set Environment Variables:**

   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL
   DATABASE_URL=postgresql://civicpulse:password@localhost:5432/civicpulse
   ```

3. **Run Migrations:**

   ```bash
   npm run migrate
   ```

4. **Seed Demo Data:**
   ```bash
   npm run seed
   ```

### Migration Commands

- **Run all pending migrations:**

  ```bash
  npm run migrate
  ```

- **Rollback last migration:**

  ```bash
  npm run migrate:down
  ```

- **Create new migration:**
  ```bash
  npm run migrate:create <migration-name>
  ```

### Seeding Commands

- **Seed database with demo data:**

  ```bash
  npm run seed
  ```

- **Reset database (drop all tables, run migrations, and seed):**
  ```bash
  npm run reset
  ```

## Demo Data

The seed script creates:

### Zones (6 total)

- Downtown (Commercial, 15,000 population)
- Riverside (Residential, 25,000 population)
- Industrial Park (Industrial, 5,000 population)
- Central Park (Park, 0 population)
- Tech District (Commercial, 12,000 population)
- Suburban Heights (Residential, 30,000 population)

### Sensors (50+ total)

Distributed across all zones with various types:

- Waste bins (fill level sensors)
- Street lights (luminosity sensors)
- Water pressure sensors
- Traffic flow sensors
- Air quality sensors (AQI)
- Noise level sensors (dB)

### Users (3 total)

- **admin** / admin123 (ADMIN role)
- **operator** / operator123 (OPERATOR role)
- **viewer** / viewer123 (VIEWER role)

## Performance Considerations

### Indexes

All tables have appropriate indexes for common query patterns:

- Time-series queries on sensor_readings
- Spatial queries on zones, sensors, incidents, work_orders
- Status and priority filtering on incidents and work_orders
- Timestamp-based queries for historical data

### Partitioning (Future Enhancement)

For production deployments with large data volumes, consider:

- Partitioning sensor_readings by timestamp (monthly or weekly)
- Partitioning agent_logs by timestamp
- Archiving old data to separate tables

### Query Optimization

- Use EXPLAIN ANALYZE to optimize slow queries
- Monitor index usage with pg_stat_user_indexes
- Consider materialized views for complex aggregations
- Use connection pooling (configured in application)

## Backup and Restore

### Backup

```bash
pg_dump -Fc civicpulse > civicpulse_backup.dump
```

### Restore

```bash
pg_restore -d civicpulse civicpulse_backup.dump
```

## Troubleshooting

### PostGIS Extension Not Found

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Migration Errors

Check the pgmigrations table to see which migrations have run:

```sql
SELECT * FROM pgmigrations ORDER BY run_on DESC;
```

### Connection Issues

Verify DATABASE_URL is correct and PostgreSQL is running:

```bash
psql $DATABASE_URL -c "SELECT version();"
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
