# CivicPulse AI - Deployment Guide

This guide covers deployment options for CivicPulse AI, from local development to production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Database Management](#database-management)
- [Health Monitoring](#health-monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18+) - for local development
- **Python** (v3.11+) - for local development

### Required API Keys

- **OpenAI API Key** - for AI agent functionality
- **Mapbox Token** - for map visualization

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd civicpulse-ai

# Run setup script
./scripts/setup.sh

# Edit .env files with your API keys
nano .env
```

### 2. Start Services

```bash
# Start all services in development mode
./scripts/start-dev.sh --all

# Or start infrastructure only (run services locally)
./scripts/start-dev.sh
```

### 3. Load Seed Data

```bash
# Load demo data
./scripts/seed-data.sh --quick

# Or load full dataset
./scripts/seed-data.sh
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Agent Runtime**: http://localhost:8001
- **ML Pipeline**: http://localhost:8002

## Development Deployment

### Using Docker Compose (Recommended)

Start all services with hot-reloading enabled:

```bash
docker-compose up
```

Or in detached mode:

```bash
docker-compose up -d
```

### Hybrid Approach (Infrastructure + Local Services)

Start only database and cache with Docker:

```bash
./scripts/start-dev.sh
```

Then run services locally in separate terminals:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Agent Runtime
cd agent-runtime
uvicorn main:app --reload --port 8001

# Terminal 4 - ML Pipeline
cd ml-pipeline
uvicorn main:app --reload --port 8002
```

### Development Commands

```bash
# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Production Deployment

### 1. Configure Environment

Create production `.env` file with secure values:

```bash
# Copy example
cp .env.example .env

# Edit with production values
nano .env
```

**Important**: Set strong passwords and secrets for production!

```env
# Database
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>

# Security
JWT_SECRET=<random-secret-key>

# API Keys
OPENAI_API_KEY=<your-key>
VITE_MAPBOX_TOKEN=<your-token>

# Environment
NODE_ENV=production
BUILD_TARGET=production
```

### 2. Deploy

```bash
# Run production deployment script
./scripts/deploy-prod.sh
```

This script will:

- Validate environment configuration
- Build optimized production images
- Start services with production settings
- Run health checks

### 3. Run Migrations

```bash
# Apply database migrations
./scripts/run-migrations.sh
```

### 4. Load Initial Data

```bash
# Load seed data
./scripts/seed-data.sh
```

### Production Commands

```bash
# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Update and restart
git pull origin main
./scripts/deploy-prod.sh
```

## Database Management

### Running Migrations

```bash
# Run all pending migrations
./scripts/run-migrations.sh
```

Migration files should be placed in `backend/migrations/` with naming convention:

```
YYYYMMDDHHMMSS_description.sql
```

### Seeding Data

```bash
# Quick demo setup (minimal data)
./scripts/seed-data.sh --quick

# Full seed (comprehensive dataset)
./scripts/seed-data.sh

# Reset and seed (WARNING: deletes all data)
./scripts/seed-data.sh --reset
```

### Database Backup

```bash
# Backup database
docker exec civicpulse-postgres pg_dump -U civicpulse civicpulse > backup.sql

# Restore database
docker exec -i civicpulse-postgres psql -U civicpulse civicpulse < backup.sql
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it civicpulse-postgres psql -U civicpulse -d civicpulse

# Connect to Redis
docker exec -it civicpulse-redis redis-cli
```

## Health Monitoring

### Health Check Script

```bash
# Single health check
./scripts/health-check.sh

# Verbose output with resource usage
./scripts/health-check.sh --verbose

# Continuous monitoring (refresh every 5s)
./scripts/health-check.sh --watch

# Custom refresh interval
./scripts/health-check.sh --watch --interval 10
```

### Manual Health Checks

```bash
# Check individual services
curl http://localhost:4000/health    # Backend
curl http://localhost:8001/health    # Agent Runtime
curl http://localhost:8002/health    # ML Pipeline
curl http://localhost:3000           # Frontend

# Check container status
docker ps

# Check container health
docker inspect --format='{{.State.Health.Status}}' civicpulse-backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 backend
```

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :4000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8001  # Agent Runtime
lsof -i :8002  # ML Pipeline

# Stop conflicting services or change ports in .env
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker exec civicpulse-postgres pg_isready -U civicpulse

# Check database logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Container Build Failures

```bash
# Clean build (no cache)
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Check disk space
docker system df
```

### Permission Issues

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix volume permissions
docker-compose down -v
docker volume rm civicpulse-postgres-data civicpulse-redis-data civicpulse-ml-models
docker-compose up -d
```

### Memory Issues

```bash
# Check Docker resource limits
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB minimum, 8GB for optimal performance
```

### Reset Everything

```bash
# Stop all services
docker-compose down

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all images
docker rmi $(docker images 'civicpulse*' -q)

# Start fresh
./scripts/setup.sh
./scripts/start-dev.sh --all
./scripts/seed-data.sh --quick
```

## Environment Variables Reference

### Global (.env)

```env
# Node Environment
NODE_ENV=development|production
BUILD_TARGET=development|production

# Database
POSTGRES_DB=civicpulse
POSTGRES_USER=civicpulse
POSTGRES_PASSWORD=<password>
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=<password>

# Backend
BACKEND_PORT=4000
JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h
LOG_LEVEL=info|debug|error

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_MAPBOX_TOKEN=<token>

# Agent Runtime
AGENT_PORT=8001
OPENAI_API_KEY=<key>
OPENAI_MODEL=gpt-4

# ML Pipeline
ML_PORT=8002
```

## Performance Optimization

### Production Optimizations

The production deployment includes:

- **Multi-stage Docker builds** - Minimal image sizes
- **Non-root users** - Enhanced security
- **Health checks** - Automatic restart on failure
- **Resource limits** - Prevent resource exhaustion
- **Logging** - Structured logs with rotation
- **Connection pooling** - Efficient database connections
- **Caching** - Redis for frequently accessed data

### Scaling Considerations

For high-traffic deployments:

1. **Horizontal Scaling**: Run multiple instances behind a load balancer
2. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
3. **Cache**: Use managed Redis (AWS ElastiCache, Redis Cloud)
4. **CDN**: Serve frontend assets via CDN
5. **Monitoring**: Add APM tools (DataDog, New Relic)

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use strong passwords** - Generate random passwords for production
3. **Enable HTTPS** - Use reverse proxy (Nginx, Traefik) with SSL
4. **Regular updates** - Keep dependencies and base images updated
5. **Network isolation** - Use Docker networks to isolate services
6. **Backup regularly** - Automate database backups
7. **Monitor logs** - Set up log aggregation and alerting

## Support

For issues or questions:

- Check logs: `docker-compose logs -f`
- Run health check: `./scripts/health-check.sh --verbose`
- Review this guide's troubleshooting section
- Check container status: `docker ps -a`
