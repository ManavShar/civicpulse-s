#!/bin/bash

# CivicPulse AI Production Deployment Script

set -e

echo "🚀 CivicPulse AI - Production Deployment"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Check for required environment variables
echo "🔐 Checking environment configuration..."

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Please create it from .env.example${NC}"
    exit 1
fi

# Source environment variables
source .env

REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "OPENAI_API_KEY"
    "VITE_MAPBOX_TOKEN"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set these variables in your .env file"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration validated${NC}"
echo ""

# Confirm production deployment
echo -e "${YELLOW}⚠️  WARNING: This will deploy CivicPulse AI in PRODUCTION mode${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Pull latest code (if in git repo)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin main || echo -e "${YELLOW}⚠️  Could not pull latest code. Continuing with current version.${NC}"
    echo ""
fi

# Build production images
echo "🏗️  Building production Docker images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

echo ""

# Start services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services. Please check the error messages above.${NC}"
    exit 1
fi

echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

SERVICES=("postgres" "redis" "backend" "agent-runtime" "ml-pipeline" "frontend")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' civicpulse-$service 2>/dev/null || echo "no-healthcheck")
    
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-healthcheck" ]; then
        STATUS=$(docker inspect --format='{{.State.Status}}' civicpulse-$service 2>/dev/null || echo "not-found")
        if [ "$STATUS" = "running" ]; then
            echo -e "  ${GREEN}✅ $service: running${NC}"
        else
            echo -e "  ${RED}❌ $service: $STATUS${NC}"
            ALL_HEALTHY=false
        fi
    else
        echo -e "  ${RED}❌ $service: $HEALTH${NC}"
        ALL_HEALTHY=false
    fi
done

echo ""

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services are running successfully!${NC}"
    echo ""
    echo "🎉 Deployment completed!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Frontend:      http://localhost:${FRONTEND_PORT:-80}"
    echo "   Backend API:   http://localhost:${BACKEND_PORT:-4000}"
    echo "   Agent Runtime: http://localhost:${AGENT_PORT:-8001}"
    echo "   ML Pipeline:   http://localhost:${ML_PORT:-8002}"
    echo ""
    echo "📝 View logs with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
    echo "🛑 Stop services with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
else
    echo -e "${YELLOW}⚠️  Some services may not be healthy. Check logs with:${NC}"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs"
fi

echo ""
