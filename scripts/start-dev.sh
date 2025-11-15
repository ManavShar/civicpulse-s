#!/bin/bash

# CivicPulse AI Development Startup Script

set -e

echo "🚀 CivicPulse AI - Development Mode Startup"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse command line arguments
ALL_SERVICES=false
DETACHED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all|-a)
            ALL_SERVICES=true
            shift
            ;;
        --detached|-d)
            DETACHED=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -a, --all       Start all services with Docker Compose"
            echo "  -d, --detached  Run in detached mode (background)"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Without --all flag, only starts database and cache services."
            echo "You can then run individual services locally for development."
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if .env files exist
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Please run ./scripts/setup.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration found${NC}"
echo ""

if [ "$ALL_SERVICES" = true ]; then
    # Start all services with Docker Compose
    echo "🐳 Starting all services with Docker Compose..."
    echo ""
    
    if [ "$DETACHED" = true ]; then
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ All services started in background${NC}"
        echo ""
        echo "📊 Check service status: ./scripts/health-check.sh"
        echo "📝 View logs: docker-compose logs -f [service-name]"
        echo "🛑 Stop services: docker-compose down"
    else
        echo -e "${BLUE}Starting services in foreground mode...${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
        echo ""
        docker-compose up
    fi
else
    # Start only database and cache services
    echo "🐳 Starting database and cache services..."
    docker-compose up -d postgres redis
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be ready..."
    sleep 5
    
    # Check if services are healthy
    if docker exec civicpulse-postgres pg_isready -U civicpulse &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL may not be ready yet${NC}"
    fi
    
    if docker exec civicpulse-redis redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is ready${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis may not be ready yet${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Infrastructure services are running!${NC}"
    echo ""
    echo "🎯 Start application services locally:"
    echo ""
    echo -e "${BLUE}Backend:${NC}"
    echo "   cd backend && npm run dev"
    echo ""
    echo -e "${BLUE}Frontend:${NC}"
    echo "   cd frontend && npm run dev"
    echo ""
    echo -e "${BLUE}Agent Runtime:${NC}"
    echo "   cd agent-runtime && uvicorn main:app --reload --port 8001"
    echo ""
    echo -e "${BLUE}ML Pipeline:${NC}"
    echo "   cd ml-pipeline && uvicorn main:app --reload --port 8002"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Or start all services with Docker:"
    echo "   ./scripts/start-dev.sh --all"
    echo ""
    echo "📊 Check service health:"
    echo "   ./scripts/health-check.sh"
    echo ""
fi
