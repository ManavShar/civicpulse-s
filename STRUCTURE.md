# CivicPulse AI - Project Structure

## Directory Layout

```
civicpulse-ai/
├── .kiro/                          # Kiro spec files
│   └── specs/
│       └── civicpulse-ai/
│           ├── requirements.md     # Feature requirements
│           ├── design.md           # System design
│           └── tasks.md            # Implementation tasks
│
├── backend/                        # Node.js/TypeScript backend
│   ├── src/
│   │   ├── index.ts               # Application entry point
│   │   ├── config/                # Configuration management
│   │   ├── services/              # Business logic services
│   │   ├── repositories/          # Data access layer
│   │   ├── routes/                # API route handlers
│   │   ├── middleware/            # Express middleware
│   │   ├── models/                # Data models and types
│   │   ├── utils/                 # Utility functions
│   │   └── scripts/               # Database seeds and migrations
│   ├── migrations/                # Database migration files
│   ├── Dockerfile                 # Backend container definition
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── .env.example               # Environment template
│   └── .env                       # Environment variables (gitignored)
│
├── frontend/                       # React/TypeScript frontend
│   ├── src/
│   │   ├── main.tsx               # Application entry point
│   │   ├── index.css              # Global styles
│   │   ├── components/            # React components
│   │   ├── stores/                # Zustand state stores
│   │   ├── services/              # API client services
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Utility functions
│   ├── public/                    # Static assets
│   ├── Dockerfile                 # Frontend container definition
│   ├── nginx.conf                 # Nginx configuration for production
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── vite.config.ts             # Vite build configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   ├── postcss.config.js          # PostCSS configuration
│   ├── .eslintrc.cjs              # ESLint configuration
│   ├── .env.example               # Environment template
│   └── .env                       # Environment variables (gitignored)
│
├── agent-runtime/                  # Python agent orchestration
│   ├── main.py                    # FastAPI application entry
│   ├── agents/                    # Agent implementations
│   │   ├── base.py                # Base agent class
│   │   ├── planner.py             # Planner agent
│   │   ├── dispatcher.py          # Dispatcher agent
│   │   └── analyst.py             # Analyst agent
│   ├── services/                  # Supporting services
│   ├── models/                    # Pydantic models
│   ├── utils/                     # Utility functions
│   ├── Dockerfile                 # Agent runtime container
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment template
│   └── .env                       # Environment variables (gitignored)
│
├── ml-pipeline/                    # Python ML services
│   ├── main.py                    # FastAPI application entry
│   ├── forecasting/               # Time-series forecasting
│   ├── anomaly/                   # Anomaly detection
│   ├── models/                    # Trained model storage
│   ├── services/                  # ML service implementations
│   ├── utils/                     # Utility functions
│   ├── Dockerfile                 # ML pipeline container
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment template
│   └── .env                       # Environment variables (gitignored)
│
├── scripts/                        # Utility scripts
│   ├── setup.sh                   # Initial setup script
│   └── start-dev.sh               # Development startup script
│
├── docker-compose.yml              # Multi-container orchestration
├── .env.example                    # Root environment template
├── .env                            # Root environment variables (gitignored)
├── .gitignore                      # Git ignore patterns
├── package.json                    # Root package.json (workspaces)
├── README.md                       # Project documentation
└── STRUCTURE.md                    # This file
```

## Service Ports

- **Frontend**: 3000 (development), 80 (production)
- **Backend**: 4000
- **Agent Runtime**: 8001
- **ML Pipeline**: 8002
- **PostgreSQL**: 5432
- **Redis**: 6379

## Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with PostGIS
- **Cache**: Redis 7
- **WebSocket**: Socket.io
- **Queue**: Bull
- **Authentication**: JWT with bcrypt
- **Logging**: Winston
- **API Docs**: Swagger/OpenAPI
- **Metrics**: Prometheus (prom-client)

### Agent Runtime

- **Language**: Python 3.11
- **Framework**: FastAPI
- **AI Framework**: LangChain
- **LLM**: OpenAI GPT-4
- **Database**: PostgreSQL (psycopg2)
- **Cache**: Redis (redis-py)

### ML Pipeline

- **Language**: Python 3.11
- **Framework**: FastAPI
- **Forecasting**: Prophet
- **Data Processing**: Pandas, NumPy
- **ML Library**: scikit-learn
- **Database**: PostgreSQL (psycopg2)

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL with PostGIS extension
- **Cache/Queue**: Redis
- **Web Server**: Nginx (production)

## Development Workflow

1. **Setup**: Run `./scripts/setup.sh` to initialize the project
2. **Configure**: Edit `.env` files with API keys and configuration
3. **Start Services**: Use `docker-compose up` or individual service commands
4. **Develop**: Make changes and services will hot-reload
5. **Build**: Run `npm run build` to create production builds
6. **Deploy**: Use Docker Compose or container orchestration platform

## Key Files

- **docker-compose.yml**: Defines all services and their relationships
- **.env.example**: Template for environment variables
- **package.json**: Root workspace configuration
- **README.md**: User-facing documentation
- **STRUCTURE.md**: This architectural overview

## Next Steps

After completing task 1 (project structure initialization), the following tasks will implement:

- Database schema and migrations (Task 2)
- Backend core architecture (Task 3)
- Sensor simulation engine (Task 4)
- Incident detection system (Task 5)
- Predictive analytics (Task 6)
- Multi-agent AI system (Task 7)
- And more...

See `.kiro/specs/civicpulse-ai/tasks.md` for the complete implementation plan.
