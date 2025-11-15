# CivicPulse AI - Agent Runtime

Multi-agent AI system for smart city operations, featuring autonomous incident analysis, work order dispatch, and decision explainability.

## Architecture

The agent runtime consists of three specialized AI agents that work together:

### 1. Planner Agent

- Analyzes incident reports and sensor data
- Assesses situation and potential impacts
- Generates structured action plans
- Prioritizes actions based on urgency and resources

### 2. Dispatcher Agent

- Reviews action plans from Planner
- Assigns tasks to appropriate field units
- Creates detailed work orders
- Optimizes resource allocation

### 3. Analyst Agent

- Explains system decisions in human-readable language
- Provides insights about incident patterns
- Summarizes agent activities
- Generates reports for operators

## Workflow

```
Incident Detected
    ↓
Planner Agent → Action Plan
    ↓
Dispatcher Agent → Work Orders
    ↓
Analyst Agent → Explanation
    ↓
Complete
```

## API Endpoints

### Process Incident

```
POST /api/agents/process-incident
Body: {
  "incident_id": "uuid",
  "force_reprocess": false
}
```

### Get Incident Status

```
GET /api/agents/incident/{incident_id}/status
```

### Get Agent Logs

```
GET /api/agents/logs?incident_id=uuid&agent_type=PLANNER&limit=100
```

### Analyze Patterns

```
GET /api/agents/patterns?zone_id=uuid&time_range_hours=24
```

### Get Conversation History

```
GET /api/agents/conversation/{incident_id}
```

## Configuration

Environment variables (see `.env.example`):

- `OPENAI_API_KEY`: OpenAI API key for LLM
- `OPENAI_MODEL`: Model to use (default: gpt-4-turbo-preview)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `BACKEND_URL`: Backend service URL
- `AGENT_MEMORY_TTL`: Memory TTL in seconds (default: 3600)
- `AGENT_TIMEOUT`: LLM call timeout in seconds (default: 30)
- `LOG_LEVEL`: Logging level (default: INFO)

## Running

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

### Production

```bash
# Using uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

# Using Docker
docker build -t civicpulse-agent-runtime .
docker run -p 8000:8000 --env-file .env civicpulse-agent-runtime
```

## Features

### Memory Management

- Redis-based agent memory with configurable TTL
- Conversation history tracking
- Cross-agent context sharing

### Error Handling

- Automatic retry with exponential backoff
- Timeout protection for LLM calls
- Comprehensive error logging

### Observability

- Structured logging to database
- Real-time pub/sub messaging
- Agent reasoning transparency

### Explainability

- Human-readable decision explanations
- Key factor identification
- Confidence scoring
- Pattern analysis and recommendations

## Dependencies

- FastAPI: Web framework
- LangChain: LLM orchestration
- OpenAI: Language model
- Redis: Memory and pub/sub
- PostgreSQL: Persistent storage
- Pydantic: Data validation
