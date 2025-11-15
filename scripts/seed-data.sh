#!/bin/bash

# CivicPulse AI Seed Data Loader

set -e

echo "🌱 CivicPulse AI - Seed Data Loader"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse command line arguments
RESET=false
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            RESET=true
            shift
            ;;
        --quick)
            QUICK=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --reset    Reset database before seeding (WARNING: deletes all data)"
            echo "  --quick    Run quick demo setup (minimal data)"
            echo "  --help     Show this help message"
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

# Check if backend container is running
if ! docker ps | grep -q civicpulse-backend; then
    echo -e "${YELLOW}⚠️  Backend container is not running${NC}"
    echo "Starting required services..."
    docker-compose up -d postgres redis backend
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

# Check database connection
echo "🔍 Checking database connection..."
if ! docker exec civicpulse-backend curl -f http://localhost:4000/health &> /dev/null; then
    echo -e "${YELLOW}⚠️  Backend is not ready yet. Waiting...${NC}"
    sleep 5
fi

echo -e "${GREEN}✅ Backend is ready${NC}"
echo ""

# Reset database if requested
if [ "$RESET" = true ]; then
    echo -e "${RED}⚠️  WARNING: This will delete ALL existing data!${NC}"
    read -p "Are you sure you want to reset the database? (yes/no): " -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "🗑️  Resetting database..."
        docker exec civicpulse-backend npm run db:reset
        echo -e "${GREEN}✅ Database reset complete${NC}"
        echo ""
    else
        echo "Reset cancelled. Continuing with seeding..."
        echo ""
    fi
fi

# Run seeding scripts
if [ "$QUICK" = true ]; then
    echo "🚀 Running quick demo setup..."
    echo ""
    
    docker exec civicpulse-backend npm run seed:quick-demo
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Quick demo setup complete!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Quick demo setup failed${NC}"
        exit 1
    fi
else
    echo "🌱 Running full seed process..."
    echo ""
    
    # Seed zones
    echo -e "${BLUE}📍 Seeding zones...${NC}"
    docker exec civicpulse-backend npm run seed:zones
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Zone seeding failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Zones seeded${NC}"
    echo ""
    
    # Seed sensors
    echo -e "${BLUE}📡 Seeding sensors...${NC}"
    docker exec civicpulse-backend npm run seed:sensors
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Sensor seeding failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Sensors seeded${NC}"
    echo ""
    
    # Seed users
    echo -e "${BLUE}👥 Seeding users...${NC}"
    docker exec civicpulse-backend npm run seed:users
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ User seeding failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Users seeded${NC}"
    echo ""
    
    # Seed historical data
    echo -e "${BLUE}📊 Seeding historical data (this may take a minute)...${NC}"
    docker exec civicpulse-backend npm run seed:historical
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Historical data seeding failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Historical data seeded${NC}"
    echo ""
fi

# Display seeding summary
echo ""
echo "📊 Seeding Summary"
echo "=================="
echo ""

# Get counts from database
echo "Fetching data counts..."
docker exec civicpulse-postgres psql -U civicpulse -d civicpulse -t -c "
SELECT 
    'Zones: ' || COUNT(*) FROM zones
    UNION ALL
    SELECT 'Sensors: ' || COUNT(*) FROM sensors
    UNION ALL
    SELECT 'Users: ' || COUNT(*) FROM users
    UNION ALL
    SELECT 'Sensor Readings: ' || COUNT(*) FROM sensor_readings
    UNION ALL
    SELECT 'Incidents: ' || COUNT(*) FROM incidents
    UNION ALL
    SELECT 'Work Orders: ' || COUNT(*) FROM work_orders;
"

echo ""
echo -e "${GREEN}✨ Seed data loading complete!${NC}"
echo ""
echo "🎯 Next steps:"
echo "   1. Start all services: docker-compose up -d"
echo "   2. Access the application at http://localhost:3000"
echo ""
echo "📝 Default users:"
echo "   Admin:    admin@civicpulse.ai / admin123"
echo "   Operator: operator@civicpulse.ai / operator123"
echo "   Viewer:   viewer@civicpulse.ai / viewer123"
echo ""
