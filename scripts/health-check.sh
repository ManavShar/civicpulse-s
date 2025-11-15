#!/bin/bash

# CivicPulse AI Service Health Check Script

set -e

echo "🏥 CivicPulse AI - Service Health Check"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse command line arguments
VERBOSE=false
WATCH=false
INTERVAL=5

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --interval|-i)
            INTERVAL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose     Show detailed health information"
            echo "  -w, --watch       Continuously monitor health (refresh every 5s)"
            echo "  -i, --interval N  Set watch interval to N seconds (default: 5)"
            echo "  -h, --help        Show this help message"
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

# Function to check service health
check_service_health() {
    local service_name=$1
    local container_name=$2
    local health_url=$3
    local port=$4
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "  ${RED}❌ $service_name: Container not running${NC}"
        return 1
    fi
    
    # Check container status
    local status=$(docker inspect --format='{{.State.Status}}' $container_name 2>/dev/null)
    
    if [ "$status" != "running" ]; then
        echo -e "  ${RED}❌ $service_name: Container status is $status${NC}"
        return 1
    fi
    
    # Check health endpoint if provided
    if [ -n "$health_url" ]; then
        if curl -sf "$health_url" > /dev/null 2>&1; then
            local uptime=$(docker inspect --format='{{.State.StartedAt}}' $container_name | xargs -I {} date -d {} +%s)
            local now=$(date +%s)
            local running_time=$((now - uptime))
            local running_hours=$((running_time / 3600))
            local running_mins=$(((running_time % 3600) / 60))
            
            echo -e "  ${GREEN}✅ $service_name: Healthy${NC}"
            
            if [ "$VERBOSE" = true ]; then
                echo -e "     ${BLUE}Port: $port | Uptime: ${running_hours}h ${running_mins}m${NC}"
                
                # Get resource usage
                local cpu=$(docker stats --no-stream --format "{{.CPUPerc}}" $container_name)
                local mem=$(docker stats --no-stream --format "{{.MemUsage}}" $container_name)
                echo -e "     ${BLUE}CPU: $cpu | Memory: $mem${NC}"
            fi
            return 0
        else
            echo -e "  ${YELLOW}⚠️  $service_name: Running but health check failed${NC}"
            return 1
        fi
    else
        echo -e "  ${GREEN}✅ $service_name: Running${NC}"
        
        if [ "$VERBOSE" = true ]; then
            echo -e "     ${BLUE}Port: $port${NC}"
        fi
        return 0
    fi
}

# Function to run all health checks
run_health_checks() {
    if [ "$WATCH" = true ]; then
        clear
        echo "🏥 CivicPulse AI - Service Health Check (Refreshing every ${INTERVAL}s)"
        echo "========================================================================"
        echo "Press Ctrl+C to stop"
        echo ""
    fi
    
    local all_healthy=true
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "⏰ Check time: $timestamp"
    echo ""
    
    # Check PostgreSQL
    if ! check_service_health "PostgreSQL" "civicpulse-postgres" "" "5432"; then
        all_healthy=false
    fi
    
    # Check Redis
    if ! check_service_health "Redis" "civicpulse-redis" "" "6379"; then
        all_healthy=false
    fi
    
    # Check Backend
    if ! check_service_health "Backend API" "civicpulse-backend" "http://localhost:4000/health" "4000"; then
        all_healthy=false
    fi
    
    # Check Agent Runtime
    if ! check_service_health "Agent Runtime" "civicpulse-agent-runtime" "http://localhost:8001/health" "8001"; then
        all_healthy=false
    fi
    
    # Check ML Pipeline
    if ! check_service_health "ML Pipeline" "civicpulse-ml-pipeline" "http://localhost:8002/health" "8002"; then
        all_healthy=false
    fi
    
    # Check Frontend
    if ! check_service_health "Frontend" "civicpulse-frontend" "http://localhost:3000" "3000"; then
        all_healthy=false
    fi
    
    echo ""
    
    if [ "$all_healthy" = true ]; then
        echo -e "${GREEN}✅ All services are healthy!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some services are not healthy${NC}"
        echo ""
        echo "💡 Troubleshooting tips:"
        echo "   - Check logs: docker-compose logs [service-name]"
        echo "   - Restart service: docker-compose restart [service-name]"
        echo "   - Restart all: docker-compose restart"
        return 1
    fi
}

# Function to show detailed system info
show_system_info() {
    echo ""
    echo "🖥️  System Information"
    echo "===================="
    echo ""
    
    # Docker version
    echo "Docker version: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    echo "Docker Compose version: $(docker-compose --version | cut -d' ' -f3 | tr -d ',')"
    echo ""
    
    # Network info
    echo "📡 Network:"
    if docker network ls | grep -q civicpulse-network; then
        echo -e "  ${GREEN}✅ civicpulse-network exists${NC}"
    else
        echo -e "  ${RED}❌ civicpulse-network not found${NC}"
    fi
    echo ""
    
    # Volume info
    echo "💾 Volumes:"
    for volume in civicpulse-postgres-data civicpulse-redis-data civicpulse-ml-models; do
        if docker volume ls | grep -q $volume; then
            local size=$(docker system df -v | grep $volume | awk '{print $3}')
            echo -e "  ${GREEN}✅ $volume${NC} (${size:-unknown})"
        else
            echo -e "  ${YELLOW}⚠️  $volume not found${NC}"
        fi
    done
    echo ""
}

# Main execution
if [ "$WATCH" = true ]; then
    # Watch mode - continuously check health
    while true; do
        run_health_checks
        sleep $INTERVAL
    done
else
    # Single check
    run_health_checks
    
    if [ "$VERBOSE" = true ]; then
        show_system_info
    fi
fi
