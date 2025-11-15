# CivicPulse AI - Database Seeding Scripts

This directory contains scripts for seeding the CivicPulse AI database with demo data.

## Quick Start

For a fast demo setup with minimal data:

```bash
npm run seed:quick
```

This will create:

- 10 city zones
- 50+ sensors across different types
- 2 days of historical data
- Demo user accounts

## Full Seeding

For a complete demo with more historical data:

```bash
npm run seed
```

This creates the same data as quick setup but with 7 days of historical data.

### Custom Historical Data Period

To specify a different number of days:

```bash
npm run seed -- --days 14
```

## Individual Seed Scripts

You can run individual seeding scripts separately:

### 1. Seed Zones

Creates geographic zones for the demo city:

```bash
npm run seed:zones
```

Creates 10 zones:

- Downtown Financial District (Commercial)
- Riverside Residential (Residential)
- Industrial Park (Industrial)
- Central Park (Park)
- Tech District (Commercial)
- Suburban Heights (Residential)
- Harbor District (Commercial)
- University Quarter (Residential)
- Green Valley Park (Park)
- Innovation Campus (Industrial)

### 2. Seed Sensors

Creates IoT sensors distributed across zones:

```bash
npm run seed:sensors
```

Generates 50+ sensors of types:

- WASTE (waste bin fill level sensors)
- LIGHT (street light sensors)
- WATER (water pressure sensors)
- TRAFFIC (traffic flow sensors)
- ENVIRONMENT (air quality sensors)
- NOISE (noise level sensors)

### 3. Seed Historical Data

Generates historical sensor readings, incidents, work orders, and agent logs:

```bash
npm run seed:historical
```

By default generates 7 days of data. Specify custom days:

```bash
npm run seed:historical 14
```

Creates:

- Realistic sensor readings with daily/weekly patterns
- Historical incidents with various severities
- Completed work orders
- Agent reasoning logs

### 4. Seed Users

Creates demo user accounts:

```bash
npm run seed:users
```

Creates three users:

- **Admin**: `admin` / `admin123` (full access)
- **Operator**: `operator` / `operator123` (operational access)
- **Viewer**: `viewer` / `viewer123` (read-only access)

## Reset Database

To clear all data and start fresh:

```bash
npm run reset
```

⚠️ **Warning**: This will delete all data in the database!

## Script Options

### reset-and-seed.ts Options

```bash
npm run seed -- [options]

Options:
  --skip-reset         Skip database reset (append data instead)
  --days <number>      Number of days of historical data (default: 7)
  --skip-validation    Skip data validation after seeding
  --help, -h           Show help message
```

### Examples

Full reset with 14 days of data:

```bash
npm run seed -- --days 14
```

Append data without resetting:

```bash
npm run seed -- --skip-reset
```

Quick seed without validation:

```bash
npm run seed -- --days 2 --skip-validation
```

## Data Validation

After seeding, the script validates:

- Minimum record counts for each table
- All sensors are assigned to zones
- All incidents have valid locations
- Sensor readings span the expected time range

## Seeding Process

The complete seeding process follows these steps:

1. **Reset Database** (optional)

   - Truncates all tables in dependency order
   - Preserves database schema

2. **Seed Zones**

   - Creates 10 geographic zones with GeoJSON boundaries
   - Assigns population and metadata

3. **Seed Sensors**

   - Distributes sensors across zones based on type
   - Configures realistic base values and thresholds
   - Adds manufacturer and installation metadata

4. **Create Demo Users**

   - Creates admin, operator, and viewer accounts
   - Hashes passwords with bcrypt

5. **Generate Historical Data**

   - **Sensor Readings**: Time-series data with realistic patterns

     - Daily cycles (rush hours, quiet periods)
     - Weekly patterns (weekday vs weekend)
     - Gaussian noise for realism
     - Anomaly injection based on probability

   - **Incidents**: Detected infrastructure problems

     - Various severities (LOW, MEDIUM, HIGH, CRITICAL)
     - 80% resolved, 20% active
     - Linked to sensors and zones

   - **Work Orders**: Maintenance tasks

     - Created for resolved incidents
     - Simulated lifecycle (created → assigned → in progress → completed)
     - Realistic duration estimates

   - **Agent Logs**: AI agent reasoning
     - Planner, Dispatcher, and Analyst logs
     - Linked to incidents and work orders
     - Timestamped decision trails

6. **Validate Data**
   - Checks record counts
   - Verifies data integrity
   - Reports any issues

## Data Characteristics

### Sensor Readings

- **Frequency**: Every 5-20 seconds per sensor (varies by type)
- **Patterns**:
  - Traffic peaks during rush hours (7-9 AM, 5-7 PM)
  - Waste bins fill gradually, empty at night
  - Street lights inverse of daylight hours
  - Air quality worse during rush hours
- **Anomalies**: 3-8% of readings (configurable)

### Incidents

- **Frequency**: ~4 incidents per day
- **Distribution**:
  - 40% LOW severity
  - 35% MEDIUM severity
  - 20% HIGH severity
  - 5% CRITICAL severity
- **Resolution**: 80% resolved within 4 hours

### Work Orders

- **Coverage**: 90% of resolved incidents
- **Duration**: 15-120 minutes based on incident type
- **Lifecycle**: Created → Assigned (15 min) → Started (30 min) → Completed

## Troubleshooting

### "No zones found" Error

Run zone seeding first:

```bash
npm run seed:zones
```

### "Connection refused" Error

Ensure PostgreSQL is running and DATABASE_URL is correct:

```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "PostGIS extension not found" Error

Install PostGIS extension:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Slow Seeding

Historical data generation can take time. For faster setup:

```bash
npm run seed:quick  # Only 2 days of data
```

## Environment Variables

Required environment variables (set in `.env`):

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/civicpulse
```

## File Structure

```
backend/src/scripts/
├── README.md                    # This file
├── seed-zones.ts               # Zone seeding
├── seed-sensors.ts             # Sensor seeding
├── seed-historical-data.ts     # Historical data generation
├── reset-and-seed.ts           # Main seeding orchestrator
├── quick-demo-setup.ts         # Fast demo setup
├── seed-users.ts               # User account creation
└── reset-db.ts                 # Database reset utility
```

## Best Practices

1. **Development**: Use `npm run seed:quick` for fast iteration
2. **Demo**: Use `npm run seed` for full demo with 7 days of data
3. **Testing**: Use `npm run seed -- --days 1` for minimal test data
4. **Production**: Never run these scripts in production!

## Notes

- All timestamps are in UTC
- Geographic coordinates use San Francisco-like locations for realism
- Sensor configurations are tuned for realistic demo behavior
- Historical data includes both normal patterns and anomalies
- Agent logs demonstrate the AI decision-making process

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Ensure database migrations are up to date: `npm run migrate`
4. Check database logs for detailed error messages
