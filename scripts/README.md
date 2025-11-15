# CivicPulse AI - Deployment Scripts

This directory contains scripts for deploying, managing, and maintaining the CivicPulse AI platform.

## Available Scripts

### 1. setup.sh

**Purpose:** Initial project setup and environment configuration

**Usage:**

```bash
./scripts/setup.sh
```

**What it does:**

- Checks for required prerequisites (Node.js, Docker, Docker Compose)
- Creates `.env` files from `.env.example` templates for all services
- Installs root-level dependencies
- Provides next steps for configuration

**When to use:**

- First time setting up the project
- After cloning the repository
- When resetting environment configuration

---

### 2. start-dev.sh

**Purpose:** Start development environment with database services

**Usage:**

```bash
./scripts/start-dev.sh
```

**What it does:**

- Starts PostgreSQL and Redis containers
- Waits for services to be healthy
- Provides commands for starting application services

**When to use:**

- Daily development work
- When you want to run services locally but use containerized databases

---

### 3. deploy-prod.sh

**Purpose:** Deploy CivicPulse AI in production mode

**Usage:**

```bash
./scripts/deploy-prod.sh
```

**What it does:**

- Validates environment configuration
- Checks for required environment variables
- Builds production Docker images with optimizations
- Stops existing containers
- Starts all services in production mode
- Performs health checks on all services
- Displays service URLs and management commands

**When to use:**

- Deploying to production environment
- Creating production builds for testing
- Deploying to staging environment

**Required environment variables:**

- `POSTGRES_PASSWORD` - Production database password
- `JWT_SECRET` - Secret key for JWT token generation
- `OPENAI_API_KEY` - OpenAI API key for agent runtime
- `VITE_MAPBOX_TOKEN` - Mapbox token for map visualization

---

### 4. run-migrations.sh

**Purpose:** Execute database migrations

**Usage:**

```bash
./scripts/run-migrations.sh
```

**What it does:**

- Checks database connectivity
- Runs all SQL migration files in `backend/migrations/` directory
- Executes migrations in alphabetical order (use timestamp prefixes)
- Displays database schema information after completion

**When to use:**

- After pulling new code with database changes
- When setting up a new database
- After creating new migration files

**Migration file naming convention:**

```
TIMESTAMP_description.sql
Example: 1700000000000_initial-schema.sql
```

---

### 5. seed-data.sh

**Purpose:** Load seed data into the database

**Usage:**

```bash
# Full seed with all data
./scripts/seed-data.sh

# Quick demo setup (minimal data)
./scripts/seed-data.sh --quick

# Reset database and seed
./scripts/seed-data.sh --reset

# Show help
./scripts/seed-data.sh --help
```

**What it does:**

- Optionally resets the database (with `--reset` flag)
- Seeds zones, sensors, users, and historical data
- Displays data counts after completion
- Provides default user credentials

**When to use:**

- Initial setup for development
- Preparing demo environments
- After database reset
- Testing with fresh data

**Default users created:**

- Admin: `admin@civicpulse.ai` / `admin123`
- Operator: `operator@civicpulse.ai` / `operator123`
- Viewer: `viewer@civicpulse.ai` / `viewer123`

---

### 6. health-check.sh

**Purpose:** Monitor service health and status

**Usage:**

```bash
# Single health check
./scripts/health-check.sh

# Verbose output with resource usage
./scripts/health-check.sh --verbose

# Continuous monitoring (refresh every 5 seconds)
./scripts/health-check.sh --watch

# Custom refresh interval
./scripts/health-check.sh --watch --interval 10

# Show help
./scripts/health-check.sh --help
```

**What it does:**

- Checks if all containers are running
- Tests health endpoints for each service
- Displays uptime and resource usage (in verbose mode)
- Provides troubleshooting tips for unhealthy services

**When to use:**

- Verifying deployment success
- Troubleshooting service issues
- Monitoring system health during demos
- Checking resource usage

**Services monitored:**

- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 4000)
- Agent Runtime (port 8001)
- ML Pipeline (port 8002)
- Frontend (port 3000)

---

### 7. verify-structure.sh

**Purpose:** Verify project structure completeness

**Usage:**

```bash
./scripts/verify-structure.sh
```

**What it does:**

- Checks for required directories
- Verifies configuration files exist
- Reports missing files or directories
- Provides next steps if structure is complete

**When to use:**

- After cloning the repository
- Verifying project integrity
- Troubleshooting missing files

---

## Common Workflows

### First-Time Setup

```bash
# 1. Setup environment
./scripts/setup.sh

# 2. Edit .env files with your API keys
# Edit: .env, backend/.env, frontend/.env, agent-runtime/.env

# 3. Start all services
docker-compose up -d

# 4. Run migrations
./scripts/run-migrations.sh

# 5. Load seed data
./scripts/seed-data.sh --quick

# 6. Verify health
./scripts/health-check.sh --verbose
```

### Daily Development

```bash
# Start database services
./scripts/start-dev.sh

# In separate terminals, start application services:
cd backend && npm run dev
cd frontend && npm run dev
cd agent-runtime && uvicorn main:app --reload --port 8001
cd ml-pipeline && uvicorn main:app --reload --port 8002
```

### Production Deployment

```bash
# 1. Ensure environment is configured
cat .env

# 2. Deploy to production
./scripts/deploy-prod.sh

# 3. Monitor health
./scripts/health-check.sh --watch
```

### Database Management

```bash
# Reset and reseed database
./scripts/seed-data.sh --reset

# Run new migrations
./scripts/run-migrations.sh

# Quick demo setup
./scripts/seed-data.sh --quick
```

### Troubleshooting

```bash
# Check service health
./scripts/health-check.sh --verbose

# View logs for specific service
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Remove all data and start fresh
docker-compose down -v
./scripts/setup.sh
docker-compose up -d
./scripts/run-migrations.sh
./scripts/seed-data.sh
```

## Environment Variables

### Required for Production

- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `REDIS_PASSWORD` - Password for Redis (production only)
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `OPENAI_API_KEY` - OpenAI API key for agent functionality
- `VITE_MAPBOX_TOKEN` - Mapbox access token for maps

### Optional Configuration

- `NODE_ENV` - Environment mode (development/production)
- `POSTGRES_USER` - Database user (default: civicpulse)
- `POSTGRES_DB` - Database name (default: civicpulse)
- `POSTGRES_PORT` - Database port (default: 5432)
- `BACKEND_PORT` - Backend API port (default: 4000)
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `AGENT_PORT` - Agent runtime port (default: 8001)
- `ML_PORT` - ML pipeline port (default: 8002)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Docker Compose Profiles

### Development Mode

```bash
docker-compose up -d
```

Uses development targets with hot-reload and volume mounts.

### Production Mode

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Uses production targets with optimized builds and no volume mounts.

## Maintenance

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Backing Up Data

```bash
# Backup PostgreSQL
docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse > backup.sql

# Backup Redis
docker exec civicpulse-redis redis-cli SAVE
docker cp civicpulse-redis:/data/dump.rdb ./redis-backup.rdb
```

### Restoring Data

```bash
# Restore PostgreSQL
docker exec -i civicpulse-postgres psql -U civicpulse civicpulse < backup.sql

# Restore Redis
docker cp ./redis-backup.rdb civicpulse-redis:/data/dump.rdb
docker-compose restart redis
```

## Performance Tuning

### Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong passwords** in production - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Update JWT_SECRET and database passwords
4. **Use HTTPS** in production - Configure reverse proxy (nginx/traefik)
5. **Limit exposed ports** - Only expose necessary ports to public

## Support

For issues or questions:

1. Check service logs: `docker-compose logs [service]`
2. Verify health: `./scripts/health-check.sh --verbose`
3. Review environment configuration
4. Check Docker and Docker Compose versions
5. Ensure all required environment variables are set
