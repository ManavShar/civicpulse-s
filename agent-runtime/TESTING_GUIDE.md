# Agent Runtime Testing Guide

## Overview

The CivicPulse AI Agent Runtime is a multi-agent system that autonomously handles city incidents through three specialized AI agents:

1. **Planner Agent** - Analyzes incidents and creates action plans
2. **Dispatcher Agent** - Creates work orders and assigns field units
3. **Analyst Agent** - Explains decisions and provides insights

## Use Case Flow

### Complete Incident Processing Workflow

```
1. Incident Detected (by backend sensor monitoring)
   ↓
2. Backend calls Agent Runtime API
   ↓
3. PLANNER AGENT analyzes incident
   - Gathers context (recent incidents, available units, weather)
   - Assesses risks and impacts
   - Generates structured action plan
   - Assigns priority (LOW/MEDIUM/HIGH/CRITICAL)
   ↓
4. DISPATCHER AGENT creates work orders
   - Reviews action plan
   - Finds available field units
   - Calculates travel times and distances
   - Creates detailed work orders
   - Assigns units to tasks
   ↓
5. ANALYST AGENT explains decisions
   - Analyzes the entire workflow
   - Generates human-readable explanations
   - Identifies key decision factors
   - Provides recommendations
   - Calculates confidence score
   ↓
6. Results stored in database and Redis
   - Agent reasoning logs saved
   - Work orders created in backend
   - Explanations available for UI display
```

## Prerequisites

### 1. Environment Setup

Make sure your `.env` file is configured:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/civicpulse

# Redis
REDIS_URL=redis://localhost:6379

# Backend Service
BACKEND_URL=http://localhost:3000

# Agent Configuration
AGENT_MEMORY_TTL=3600
AGENT_TIMEOUT=30
AGENT_MAX_RETRIES=3

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

### 2. Start Required Services

```bash
# Terminal 1: Start PostgreSQL (if not running)
# Using Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres

# Terminal 2: Start Redis (if not running)
# Using Docker:
docker run -d -p 6379:6379 redis

# Terminal 3: Start Backend (Node.js)
cd backend
npm run dev

# Terminal 4: Start Agent Runtime (Python)
cd agent-runtime
python main.py
```

### 3. Verify Services are Running

```bash
# Check Agent Runtime health
curl http://localhost:8000/health

# Check Agent Runtime readiness
curl http://localhost:8000/ready

# Check Backend health
curl http://localhost:4000/health
```

## Testing Methods

### Method 1: Using curl (Command Line)

#### Step 1: Get an Incident ID

First, you need an incident from the backend:

```bash
# List recent incidents
curl http://localhost:4000/api/v1/incidents | jq '.data[0]'

# Or create a test incident
curl -X POST http://localhost:4000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WASTE_OVERFLOW",
    "category": "WASTE",
    "severity": "HIGH",
    "description": "Waste bin overflowing at Main Street",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "zone_id": "zone-uuid-here",
    "sensor_id": "sensor-uuid-here"
  }'
```

#### Step 2: Process Incident Through Agents

```bash
# Replace INCIDENT_ID with actual UUID from step 1
curl -X POST http://localhost:8000/api/agents/process-incident \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "INCIDENT_ID",
    "force_reprocess": false
  }' | jq '.'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Incident processed successfully",
  "data": {
    "incident_id": "...",
    "status": "completed",
    "action_plan": {
      "situation_summary": "Waste overflow detected...",
      "risk_assessment": "Medium risk of environmental impact...",
      "recommended_actions": [
        "Dispatch waste collection unit immediately",
        "Inspect bin for damage",
        "Schedule preventive maintenance"
      ],
      "resource_requirements": {
        "personnel": 2,
        "equipment": ["waste truck", "cleaning supplies"],
        "time": "30 minutes"
      },
      "timeline": "Immediate response within 15 minutes",
      "priority": "HIGH"
    },
    "dispatch_result": {
      "assignments": [
        {
          "unit_id": "UNIT-001",
          "unit_type": "maintenance",
          "estimated_arrival": 12,
          "distance": 850.5
        }
      ],
      "work_orders": [...],
      "estimated_completion": "Work should be completed within 45 minutes"
    },
    "explanation": {
      "explanation": "The system detected a high-priority waste overflow...",
      "key_factors": [
        "High severity level",
        "Public health concern",
        "Nearby residential area"
      ],
      "recommendations": [
        "Increase monitoring frequency",
        "Consider larger capacity bins"
      ],
      "confidence": 0.85
    },
    "workflow_completed": true
  }
}
```

#### Step 3: Check Incident Status

```bash
curl http://localhost:8000/api/agents/incident/INCIDENT_ID/status | jq '.'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "incident_id": "...",
    "has_action_plan": true,
    "has_dispatch_result": true,
    "has_explanation": true,
    "conversation_length": 3,
    "completed": true
  }
}
```

#### Step 4: View Agent Logs

```bash
# All logs
curl http://localhost:8000/api/agents/logs | jq '.'

# Logs for specific incident
curl "http://localhost:8000/api/agents/logs?incident_id=INCIDENT_ID" | jq '.'

# Logs for specific agent
curl "http://localhost:8000/api/agents/logs?agent_type=PLANNER" | jq '.'
```

#### Step 5: View Conversation History

```bash
curl http://localhost:8000/api/agents/conversation/INCIDENT_ID | jq '.'
```

#### Step 6: Analyze Patterns

```bash
# Analyze all incidents in last 24 hours
curl "http://localhost:8000/api/agents/patterns?time_range_hours=24" | jq '.'

# Analyze specific zone
curl "http://localhost:8000/api/agents/patterns?zone_id=ZONE_ID&time_range_hours=48" | jq '.'
```

### Method 2: Using Python Script

Create a test script `test_agents.py`:

```python
import requests
import json
import time

BASE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:3000"

def test_agent_workflow():
    """Test complete agent workflow"""

    # Step 1: Get a test incident
    print("1. Fetching test incident...")
    response = requests.get(f"{BACKEND_URL}/api/v1/incidents")
    incidents = response.json()["data"]

    if not incidents:
        print("No incidents found. Create one first!")
        return

    incident_id = incidents[0]["id"]
    print(f"   Using incident: {incident_id}")
    print(f"   Type: {incidents[0]['type']}")
    print(f"   Severity: {incidents[0]['severity']}\n")

    # Step 2: Process through agents
    print("2. Processing through agent workflow...")
    response = requests.post(
        f"{BASE_URL}/api/agents/process-incident",
        json={"incident_id": incident_id, "force_reprocess": True}
    )

    if response.status_code == 200:
        result = response.json()
        print("   ✓ Processing successful!\n")

        # Display action plan
        plan = result["data"]["action_plan"]
        print("   PLANNER AGENT OUTPUT:")
        print(f"   - Priority: {plan['priority']}")
        print(f"   - Summary: {plan['situation_summary'][:100]}...")
        print(f"   - Actions: {len(plan['recommended_actions'])} recommended\n")

        # Display dispatch result
        dispatch = result["data"]["dispatch_result"]
        print("   DISPATCHER AGENT OUTPUT:")
        print(f"   - Units assigned: {len(dispatch['assignments'])}")
        print(f"   - Work orders: {len(dispatch['work_orders'])}")
        print(f"   - Timeline: {dispatch['estimated_completion']}\n")

        # Display explanation
        explanation = result["data"]["explanation"]
        print("   ANALYST AGENT OUTPUT:")
        print(f"   - Confidence: {explanation['confidence']:.2%}")
        print(f"   - Key factors: {len(explanation['key_factors'])}")
        print(f"   - Explanation: {explanation['explanation'][:100]}...\n")
    else:
        print(f"   ✗ Error: {response.status_code}")
        print(f"   {response.text}\n")

    # Step 3: Check status
    print("3. Checking incident status...")
    response = requests.get(f"{BASE_URL}/api/agents/incident/{incident_id}/status")
    status = response.json()["data"]
    print(f"   Completed: {status['completed']}")
    print(f"   Conversation messages: {status['conversation_length']}\n")

    # Step 4: View logs
    print("4. Fetching agent logs...")
    response = requests.get(
        f"{BASE_URL}/api/agents/logs",
        params={"incident_id": incident_id, "limit": 10}
    )
    logs = response.json()["data"]
    print(f"   Found {len(logs)} log entries")
    for log in logs[:3]:
        print(f"   - {log['agent_type']}: {log['step']}")
    print()

    # Step 5: Pattern analysis
    print("5. Analyzing patterns...")
    response = requests.get(
        f"{BASE_URL}/api/agents/patterns",
        params={"time_range_hours": 24}
    )
    patterns = response.json()["data"]
    print(f"   Incidents analyzed: {patterns['incidents_analyzed']}")
    print(f"   Patterns found: {len(patterns['patterns'])}")
    print(f"   Insights: {patterns['insights'][:100]}...\n")

    print("✓ All tests completed!")

if __name__ == "__main__":
    test_agent_workflow()
```

Run it:

```bash
python test_agents.py
```

### Method 3: Using Postman or Insomnia

Import this collection:

```json
{
  "name": "CivicPulse Agent Runtime",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "http://localhost:8000/health"
    },
    {
      "name": "Process Incident",
      "method": "POST",
      "url": "http://localhost:8000/api/agents/process-incident",
      "body": {
        "incident_id": "{{incident_id}}",
        "force_reprocess": false
      }
    },
    {
      "name": "Get Incident Status",
      "method": "GET",
      "url": "http://localhost:8000/api/agents/incident/{{incident_id}}/status"
    },
    {
      "name": "Get Agent Logs",
      "method": "GET",
      "url": "http://localhost:8000/api/agents/logs?limit=50"
    },
    {
      "name": "Analyze Patterns",
      "method": "GET",
      "url": "http://localhost:8000/api/agents/patterns?time_range_hours=24"
    }
  ]
}
```

## Understanding the Output

### Action Plan Structure

```json
{
  "situation_summary": "Brief 2-3 sentence description",
  "risk_assessment": "Evaluation of risks and escalation potential",
  "recommended_actions": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3"
  ],
  "resource_requirements": {
    "personnel": 2,
    "equipment": ["list", "of", "equipment"],
    "time": "estimated time"
  },
  "timeline": "Suggested sequence and timing",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL"
}
```

### Dispatch Result Structure

```json
{
  "assignments": [
    {
      "unit_id": "UNIT-001",
      "unit_type": "maintenance",
      "estimated_arrival": 15,
      "distance": 1200.5
    }
  ],
  "work_orders": [
    {
      "incident_id": "...",
      "title": "Work order title",
      "description": "Detailed description",
      "priority": "HIGH",
      "assigned_unit_id": "UNIT-001",
      "estimated_duration": 30,
      "location": {"type": "Point", "coordinates": [...]},
      "zone_id": "..."
    }
  ],
  "estimated_completion": "Timeline description"
}
```

### Explanation Structure

```json
{
  "explanation": "Human-readable 3-5 sentence explanation",
  "key_factors": [
    "Factor 1 that influenced the decision",
    "Factor 2 that influenced the decision"
  ],
  "recommendations": [
    "Additional recommendation 1",
    "Additional recommendation 2"
  ],
  "confidence": 0.85
}
```

## Common Issues and Troubleshooting

### Issue 1: "ModuleNotFoundError: No module named 'langchain.prompts'"

**Solution:** Already fixed! The imports have been updated to use `langchain_core`.

### Issue 2: "Incident not found"

**Solution:** Make sure the incident exists in the backend database:

```bash
curl http://localhost:3000/api/v1/incidents
```

### Issue 3: "OpenAI API key not configured"

**Solution:** Set your OpenAI API key in `.env`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

### Issue 4: "Redis connection failed"

**Solution:** Start Redis:

```bash
docker run -d -p 6379:6379 redis
```

### Issue 5: "Database connection failed"

**Solution:** Check PostgreSQL is running and DATABASE_URL is correct.

## Monitoring Agent Activity

### Real-time Logs

Watch the agent runtime logs in real-time:

```bash
# In the terminal where agent-runtime is running
# You'll see logs like:
# INFO - Planner analyzing incident: abc-123
# INFO - Planner created action plan with priority HIGH
# INFO - Dispatcher processing incident: abc-123
# INFO - Dispatcher created 2 work orders
# INFO - Analyst explaining decisions for incident: abc-123
```

### Database Queries

Check agent activity directly in the database:

```sql
-- View recent agent logs
SELECT agent_type, step, incident_id, created_at
FROM agent_logs
ORDER BY created_at DESC
LIMIT 20;

-- View work orders created by agents
SELECT id, title, status, priority, created_at
FROM work_orders
ORDER BY created_at DESC
LIMIT 10;
```

### Redis Inspection

Check agent memory in Redis:

```bash
redis-cli
> KEYS agent:*
> GET agent:memory:PLANNER:incident-id:action_plan
```

## Next Steps

1. **Integration Testing**: Test the complete flow from sensor data → incident detection → agent processing → work order completion

2. **Performance Testing**: Process multiple incidents simultaneously to test agent coordination

3. **UI Integration**: Connect the frontend to display agent messages, explanations, and work orders in real-time

4. **Scenario Testing**: Test different incident types (waste, lighting, water, traffic, environmental) to see how agents adapt their responses

## Demo Script

For presentations, follow this script:

1. **Show the dashboard** with active incidents
2. **Trigger agent processing** for a high-priority incident
3. **Watch in real-time** as agents coordinate:
   - Planner analyzes and creates plan
   - Dispatcher assigns units and creates work orders
   - Analyst explains the decisions
4. **Display the explanation** to show AI transparency
5. **Show work order** being executed
6. **Run pattern analysis** to demonstrate insights

This demonstrates the complete autonomous incident response workflow!
