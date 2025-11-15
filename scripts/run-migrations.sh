#!/bin/bash

# CivicPulse AI Database Migration Runner

set -e

echo "🗄️  CivicPulse AI - Database Migration Runner"
echo "============================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Source environment variables
source .env

# Set defaults
POSTGRES_USER=${POSTGRES_USER:-civicpulse}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-civicpulse_dev}
POSTGRES_DB=${POSTGRES_DB:-civicpulse}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "📊 Database: ${POSTGRES_DB}"
echo "🖥️  Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo ""

# Check if PostgreSQL is accessible
echo "🔍 Checking database connection..."

if ! docker exec civicpulse-postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to database. Is PostgreSQL running?${NC}"
    echo ""
    echo "Start PostgreSQL with: docker-compose up -d postgres"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Check if backend container is running
if ! docker ps | grep -q civicpulse-backend; then
    echo -e "${YELLOW}⚠️  Backend container is not running${NC}"
    echo "Starting backend container..."
    docker-compose up -d backend
    sleep 5
fi

# Run migrations
echo "🚀 Running database migrations..."
echo ""

# Check if migrations directory exists
if [ ! -d "backend/migrations" ]; then
    echo -e "${YELLOW}⚠️  No migrations directory found at backend/migrations${NC}"
    echo "Creating migrations directory..."
    mkdir -p backend/migrations
fi

# Count migration files
MIGRATION_COUNT=$(find backend/migrations -name "*.sql" 2>/dev/null | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No migration files found${NC}"
    echo ""
    echo "Migration files should be placed in: backend/migrations/"
    echo "Files should be named: TIMESTAMP_description.sql"
    exit 0
fi

echo "Found $MIGRATION_COUNT migration file(s)"
echo ""

# Run each migration file in order
for migration_file in backend/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "📝 Applying migration: $filename"
        
        # Execute migration using docker exec
        if docker exec -i civicpulse-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < "$migration_file"; then
            echo -e "${GREEN}✅ Migration applied: $filename${NC}"
        else
            echo -e "${RED}❌ Migration failed: $filename${NC}"
            echo ""
            echo "Please check the migration file and database logs"
            exit 1
        fi
        echo ""
    fi
done

echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo ""

# Show current database schema info
echo "📊 Database Schema Information:"
echo ""

docker exec civicpulse-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo "✨ Migration process complete!"
