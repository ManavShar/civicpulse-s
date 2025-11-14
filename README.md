# CivicPulse AI

Autonomous smart city micro-operations platform with real-time digital twin visualization, predictive analytics, and multi-agent AI orchestration.

## Overview

CivicPulse AI is a comprehensive smart city operations platform that combines:

- **Real-time Digital Twin Dashboard**: Interactive map visualization with live sensor data
- **Predictive Analytics**: ML-powered forecasting of infrastructure failures
- **Multi-Agent AI System**: Autonomous planning, dispatching, and analysis
- **Incident Management**: Automated detection and prioritization
- **Work Order Automation**: Intelligent task assignment and tracking
- **Historical Replay**: Timeline reconstruction for analysis
- **Scenario Demonstrations**: Pre-configured event simulations

## Architecture

The system consists of four main components:

- **Frontend** (React + TypeScript): Digital twin dashboard with real-time visualization
- **Backend** (Node.js + TypeScript): REST API, WebSocket server, and core services
- **Agent Runtime** (Python + FastAPI): Multi-agent AI orchestration with LangChain
- **ML Pipeline** (Python + FastAPI): Time-series forecasting and anomaly detection

## Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 16+ with PostGIS extension
- Redis 7+

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd civicpulse-ai

# Copy environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp agent-runtime/.env.example agent-runtime/.env
cp ml-pipeline/.env.example ml-pipeline/.env

# Edit .env files with your configuration
# Required: OPENAI_API_KEY, VITE_MAPBOX_TOKEN
```

### 2. Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Agent Runtime: http://localhost:8001
- ML Pipeline: http://localhost:8002

### 3. Local Development

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Agent Runtime

```bash
cd agent-runtime
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

#### ML Pipeline

```bash
cd ml-pipeline
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

## Configuration

### Environment Variables

See `.env.example` files in each directory for required configuration.

Key variables:

- `OPENAI_API_KEY`: Required for agent AI functionality
- `VITE_MAPBOX_TOKEN`: Required for map visualization
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

## Development

### Project Structure

```
civicpulse-ai/
├── frontend/           # React frontend application
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/            # Node.js backend services
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── agent-runtime/      # Python agent orchestration
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── ml-pipeline/        # Python ML services
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

### Scripts

Root level:

- `npm run dev`: Start all services in development mode
- `npm run build`: Build all services
- `npm run docker:up`: Start Docker Compose services
- `npm run docker:down`: Stop Docker Compose services

## API Documentation

Once the backend is running, API documentation is available at:

- Swagger UI: http://localhost:4000/api-docs
- OpenAPI Spec: http://localhost:4000/api-docs.json

## License

MIT

## Contributing

This is a hackathon demonstration project. For production use, additional security hardening, testing, and optimization would be required.
