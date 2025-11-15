# CivicPulse AI - Deployment Guide

This guide provides comprehensive instructions for deploying CivicPulse AI in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)
- [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 20GB minimum for Docker images and data

### Software Requirements

- **Docker**: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository
- **curl**: For health checks (usually pre-installed)

### API Keys Required

- **OpenAI API Key**: For agent AI functionality ([Get API Key](https://platform.openai.com/api-keys))
- **Mapbox Token**: For map visualization ([Get Token](https://account.mapbox.com/access-tokens/))

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd civicpulse-ai
```

### 2. Run Setup Script

```bash
./scripts/setup.sh
```

This will:

- Check prerequisites
- Create `.env` files from templates
- Install root dependencies

### 3. Configure Environment

Edit the `.env` files with your API keys:

```bash
# Root .env
OPENAI_API_KEY=sk-...
VITE_MAPBOX_TOKEN=pk.eyJ1...

# backend/.env
JWT_SECRET=your-secret-key-min-32-chars

# agent-runtime/.env
OPENAI_API_KEY=sk-...

# frontend/.env
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Initialize Database

```bash
# Run migrations
./scripts/run-migrations.sh

# Load demo data
./scripts/seed-data.sh --quick
```

### 6. Verify Deployment

```bash
./scripts/health-check.sh --verbose
```

### 7. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api-docs

**Default Login**:

- Email: `admin@civicpulse.ai`
- Password: `admin123`

## Development Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down
```

### Local Development (Without Docker)

#### 1. Start Infrastructure Services

```bash
./scripts/start-dev.sh
```

This starts PostgreSQL and Redis in Docker.

#### 2. Start Application Services

**Terminal 1 - Backend:**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 - Agent Runtime:**

```bash
cd agent-runtime
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Terminal 4 - ML Pipeline:**

```bash
cd ml-pipeline
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

## Production Deployment

### Automated Production Deployment

```bash
./scripts/deploy-prod.sh
```

This script will:

1. Validate environment configuration
2. Build optimized production images
3. Stop existing containers
4. Start services in production mode
5. Perform health checks
6. Display service URLs

### Manual Production Deployment

#### 1. Configure Production Environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
# Database
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_USER=civicpulse
POSTGRES_DB=civicpulse

# Redis
REDIS_PASSWORD=<strong-random-password>

# Backend
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=24h

# API Keys
OPENAI_API_KEY=sk-...
VITE_MAPBOX_TOKEN=pk.eyJ1...

# URLs (adjust for your domain)
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

#### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
```

#### 3. Start Production Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### 4. Initialize Database

```bash
./scripts/run-migrations.sh
./scripts/seed-data.sh
```

#### 5. Verify Deployment

```bash
./scripts/health-check.sh --watch
```

### Production Considerations

#### Security

1. **Use Strong Passwords**

   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **Enable HTTPS**

   - Use a reverse proxy (nginx, traefik, caddy)
   - Obtain SSL certificates (Let's Encrypt)
   - Configure CORS properly

3. **Secure Environment Variables**

   - Never commit `.env` files
   - Use secrets management (Docker secrets, Kubernetes secrets)
   - Rotate credentials regularly

4. **Network Security**
   - Use firewall rules
   - Limit exposed ports
   - Use private networks for inter-service communication

#### Performance

1. **Resource Limits**

   Add to `docker-compose.prod.yml`:

   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: "2.0"
             memory: 2G
           reservations:
             cpus: "1.0"
             memory: 1G
   ```

2. **Database Optimization**

   - Configure connection pooling
   - Add appropriate indexes
   - Regular VACUUM and ANALYZE

3. **Caching Strategy**
   - Configure Redis maxmemory policy
   - Set appropriate TTLs
   - Monitor cache hit rates

#### Monitoring

1. **Log Aggregation**

   ```bash
   # View all logs
   docker-compose logs -f

   # View specific service
   docker-compose logs -f backend

   # Export logs
   docker-compose logs > logs.txt
   ```

2. **Health Monitoring**

   ```bash
   # Continuous monitoring
   ./scripts/health-check.sh --watch --interval 10
   ```

3. **Metrics Collection**
   - Backend exposes `/metrics` endpoint (Prometheus format)
   - Configure Prometheus and Grafana for visualization

## Docker Configuration

### Multi-Stage Builds

All Dockerfiles use multi-stage builds for optimization:

- **Base Stage**: Install dependencies
- **Development Stage**: Include dev tools and hot-reload
- **Build Stage**: Compile application
- **Production Stage**: Minimal runtime image

### Build Targets

Specify build target with `BUILD_TARGET` environment variable:

```bash
# Development (default)
BUILD_TARGET=development docker-compose up -d

# Production
BUILD_TARGET=production docker-compose up -d
```

### Image Optimization

Production images are optimized for:

- **Size**: Multi-stage builds remove build dependencies
- **Security**: Non-root users, minimal base images
- **Performance**: Compiled assets, production dependencies only

### Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 10s
```

## Environment Variables

### Required Variables

| Variable            | Description               | Example                   |
| ------------------- | ------------------------- | ------------------------- |
| `OPENAI_API_KEY`    | OpenAI API key for agents | `sk-...`                  |
| `VITE_MAPBOX_TOKEN` | Mapbox access token       | `pk.eyJ1...`              |
| `POSTGRES_PASSWORD` | Database password         | `secure_password`         |
| `JWT_SECRET`        | JWT signing secret        | `min-32-character-secret` |

### Optional Variables

| Variable         | Default       | Description          |
| ---------------- | ------------- | -------------------- |
| `NODE_ENV`       | `development` | Environment mode     |
| `POSTGRES_USER`  | `civicpulse`  | Database user        |
| `POSTGRES_DB`    | `civicpulse`  | Database name        |
| `POSTGRES_PORT`  | `5432`        | Database port        |
| `BACKEND_PORT`   | `4000`        | Backend API port     |
| `FRONTEND_PORT`  | `3000`        | Frontend port        |
| `AGENT_PORT`     | `8001`        | Agent runtime port   |
| `ML_PORT`        | `8002`        | ML pipeline port     |
| `LOG_LEVEL`      | `info`        | Logging level        |
| `JWT_EXPIRES_IN` | `24h`         | JWT token expiration |

### Environment Files

Each service has its own `.env` file:

- **Root `.env`**: Shared configuration
- **`backend/.env`**: Backend-specific config
- **`frontend/.env`**: Frontend-specific config
- **`agent-runtime/.env`**: Agent runtime config
- **`ml-pipeline/.env`**: ML pipeline config

## Database Setup

### Initial Setup

```bash
# Run migrations
./scripts/run-migrations.sh

# Load seed data
./scripts/seed-data.sh
```

### Migration Management

Migrations are SQL files in `backend/migrations/`:

```
backend/migrations/
├── 1700000000000_initial-schema.sql
├── 1700000001000_create-users-table.sql
└── ...
```

**Naming Convention**: `TIMESTAMP_description.sql`

**Creating New Migration**:

```bash
# Create new migration file
touch backend/migrations/$(date +%s)000_add-new-feature.sql

# Edit the file with SQL commands
# Run migrations
./scripts/run-migrations.sh
```

### Seed Data

```bash
# Quick demo setup (minimal data)
./scripts/seed-data.sh --quick

# Full seed (all data)
./scripts/seed-data.sh

# Reset and reseed
./scripts/seed-data.sh --reset
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it civicpulse-postgres psql -U civicpulse -d civicpulse

# Run SQL query
docker exec civicpulse-postgres psql -U civicpulse -d civicpulse -c "SELECT COUNT(*) FROM sensors;"

# Dump database
docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse > backup.sql

# Restore database
docker exec -i civicpulse-postgres psql -U civicpulse civicpulse < backup.sql
```

## Monitoring and Health Checks

### Health Check Script

```bash
# Single check
./scripts/health-check.sh

# Verbose output
./scripts/health-check.sh --verbose

# Continuous monitoring
./scripts/health-check.sh --watch

# Custom interval (seconds)
./scripts/health-check.sh --watch --interval 10
```

### Service Health Endpoints

All services expose `/health` endpoints:

- Backend: http://localhost:4000/health
- Agent Runtime: http://localhost:8001/health
- ML Pipeline: http://localhost:8002/health

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last N lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 backend
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Specific container
docker stats civicpulse-backend

# Disk usage
docker system df

# Detailed volume info
docker system df -v
```

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

#### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec civicpulse-postgres pg_isready -U civicpulse

# Restart PostgreSQL
docker-compose restart postgres
```

#### Port Conflicts

```bash
# Check what's using a port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Change port in .env
BACKEND_PORT=4001

# Restart services
docker-compose down
docker-compose up -d
```

#### Out of Memory

```bash
# Check Docker memory
docker stats

# Increase Docker memory limit (Docker Desktop settings)
# Or add resource limits to docker-compose.yml

# Clean up unused resources
docker system prune -a
```

#### Permission Errors

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix volume permissions
docker-compose down -v
docker-compose up -d
```

### Debug Mode

Enable debug logging:

```bash
# In .env
LOG_LEVEL=debug

# Restart services
docker-compose restart
```

### Reset Everything

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
./scripts/setup.sh
docker-compose up -d
./scripts/run-migrations.sh
./scripts/seed-data.sh
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse > backup-$(date +%Y%m%d).sql

# Compressed backup
docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Database Restore

```bash
# Restore from backup
docker exec -i civicpulse-postgres psql -U civicpulse civicpulse < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | docker exec -i civicpulse-postgres psql -U civicpulse civicpulse
```

### Redis Backup

```bash
# Trigger save
docker exec civicpulse-redis redis-cli SAVE

# Copy backup file
docker cp civicpulse-redis:/data/dump.rdb ./redis-backup.rdb
```

### Redis Restore

```bash
# Stop Redis
docker-compose stop redis

# Copy backup file
docker cp ./redis-backup.rdb civicpulse-redis:/data/dump.rdb

# Start Redis
docker-compose start redis
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm \
  -v civicpulse-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data-backup.tar.gz /data

# Restore volume
docker run --rm \
  -v civicpulse-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-data-backup.tar.gz -C /
```

### Automated Backups

Create a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/civicpulse-ai && docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse | gzip > /backups/civicpulse-$(date +\%Y\%m\%d).sql.gz
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Scripts README](scripts/README.md)

## Support

For issues or questions:

1. Check service logs: `docker-compose logs [service]`
2. Run health check: `./scripts/health-check.sh --verbose`
3. Review this deployment guide
4. Check environment configuration
5. Verify Docker and Docker Compose versions

## License

MIT
