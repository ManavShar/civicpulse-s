#!/bin/bash

# CivicPulse AI Development Startup Script

set -e

echo "🚀 Starting CivicPulse AI in development mode..."

# Check if .env files exist
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run ./scripts/setup.sh first."
    exit 1
fi

# Start Docker services (PostgreSQL and Redis)
echo "🐳 Starting database and cache services..."
docker-compose up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

echo "✅ Services are ready!"
echo ""
echo "🎯 You can now start the application services:"
echo "   Backend:       cd backend && npm run dev"
echo "   Frontend:      cd frontend && npm run dev"
echo "   Agent Runtime: cd agent-runtime && uvicorn main:app --reload --port 8001"
echo "   ML Pipeline:   cd ml-pipeline && uvicorn main:app --reload --port 8002"
echo ""
echo "Or use Docker Compose for all services:"
echo "   docker-compose up"
echo ""
