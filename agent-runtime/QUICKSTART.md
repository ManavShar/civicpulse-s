# Agent Runtime Quick Start

## What the Agent System Does

The CivicPulse AI agent system autonomously handles city incidents through three AI agents:

1. **Planner Agent** - Analyzes the incident, assesses risks, and creates an action plan
2. **Dispatcher Agent** - Assigns field units and creates work orders
3. **Analyst Agent** - Explains why decisions were made (AI transparency)

## Real-World Use Case Example

**Scenario:** A waste bin overflow is detected by a sensor

**What Happens:**

1. Backend detects the incident from sensor data
2. Backend calls the agent runtime API
3. **Planner Agent** analyzes:
   - "High priority waste overflow in residential area"
   - "Risk of environmental contamination and public health concern"
   - "Recommend immediate dispatch of waste collection unit"
4. **Dispatcher Agent** executes:
   - Finds nearest available waste collection unit (UNIT-001)
   - Calculates 12-minute ETA
   - Creates work order with 30-minute estimated duration
5. **Analyst Agent** explains:
   - "This incident was prioritized due to high severity, public health concern, and proximity to residential area"
   - Confidence: 85%
   - Recommendation: "Consider larger capacity bins for this location"

## Quick Test (5 minutes)

### Step 1: Run the test script

```bash
cd agent-runtime
python test_agents.py
```

You'll see output like:

```
============================================================
  CivicPulse AI Agent Runtime - Test Script
============================================================

============================================================
  Step 1: Health Checks
============================================================

✓ Agent Runtime is healthy
✓ Backend is healthy

============================================================
  Step 2: Get Test Incident
============================================================

✓ Found test incident: 86103000-f337-492f-b9d8-3b6b47c1d694
  Type: WASTE_OVERFLOW
  Severity: CRITICAL
  Status: RESOLVED

============================================================
  Step 3: Process Incident Through Agents
============================================================

  Processing incident: 86103000-f337-492f-b9d8-3b6b47c1d694
  This may take 10-30 seconds depending on LLM response time...
✓ Incident processed successfully!

  📋 PLANNER AGENT:
     Priority: HIGH
     Summary: Critical waste overflow detected in Innovation Campus requiring imme...
     Actions: 4 recommended

  🚚 DISPATCHER AGENT:
     Units assigned: 2
     Work orders: 2
     First unit: UNIT-001 (ETA: 8min)

  💡 ANALYST AGENT:
     Confidence: 87.0%
     Key factors: 3
     Explanation: The system prioritized this incident due to critical severity lev...

============================================================
  Step 4: Check Processing Status
============================================================

  Has action plan: True
  Has dispatch result: True
  Has explanation: True
  Conversation messages: 3
  Completed: True

============================================================
  Step 5: View Agent Logs
============================================================

✓ Found 15 log entries

  1. PLANNER - ANALYSIS_START
     Time: 2025-11-15T...
     Incident: 86103000...

  2. PLANNER - CONTEXT_GATHERED
     Time: 2025-11-15T...
     Incident: 86103000...

  ... and 13 more entries

============================================================
  Step 6: Analyze Patterns
============================================================

✓ Pattern analysis complete
  Incidents analyzed: 28
  Patterns found: 3

  Insights:
  The most frequent incident type accounts for 35.7% of all incidents,
  suggesting a systematic issue that may benefit from preventive measures...

  Recommendations:
  1. Consider implementing preventive maintenance program
  2. Increase monitoring frequency in high-priority areas
  3. Deploy additional sensors in affected zones

============================================================
  Test Complete!
============================================================

✓ All agent tests passed successfully
  Check the agent runtime logs for detailed execution traces
  View the frontend dashboard to see the results visually
```

### Step 2: Test individual endpoints

```bash
# Get an incident ID from the backend
INCIDENT_ID=$(curl -s http://localhost:4000/api/v1/incidents | jq -r '.incidents[0].id')

echo "Testing with incident: $INCIDENT_ID"

# Process the incident through agents
curl -X POST http://localhost:8000/api/agents/process-incident \
  -H "Content-Type: application/json" \
  -d "{\"incident_id\": \"$INCIDENT_ID\", \"force_reprocess\": true}" \
  | jq '.'

# Check the status
curl http://localhost:8000/api/agents/incident/$INCIDENT_ID/status | jq '.'

# View agent logs
curl "http://localhost:8000/api/agents/logs?incident_id=$INCIDENT_ID&limit=5" | jq '.'

# View conversation history
curl http://localhost:8000/api/agents/conversation/$INCIDENT_ID | jq '.'

# Analyze patterns
curl "http://localhost:8000/api/agents/patterns?time_range_hours=24" | jq '.'
```

## Understanding the Workflow

### 1. Planner Agent Output

```json
{
  "situation_summary": "Critical waste overflow detected requiring immediate attention",
  "risk_assessment": "High risk of environmental contamination and public health impact",
  "recommended_actions": [
    "Dispatch waste collection unit immediately",
    "Inspect bin for damage or malfunction",
    "Schedule preventive maintenance",
    "Monitor surrounding area for contamination"
  ],
  "resource_requirements": {
    "personnel": 2,
    "equipment": ["waste truck", "cleaning supplies", "protective gear"],
    "time": "30-45 minutes"
  },
  "timeline": "Immediate response within 15 minutes, completion within 1 hour",
  "priority": "HIGH"
}
```

### 2. Dispatcher Agent Output

```json
{
  "assignments": [
    {
      "unit_id": "UNIT-001",
      "unit_type": "maintenance",
      "estimated_arrival": 12,
      "distance": 850.5
    }
  ],
  "work_orders": [
    {
      "incident_id": "...",
      "title": "Emergency Waste Collection - Innovation Campus",
      "description": "Critical waste overflow requiring immediate collection...",
      "priority": "HIGH",
      "assigned_unit_id": "UNIT-001",
      "estimated_duration": 30,
      "location": { "type": "Point", "coordinates": [-122.345, 37.775] },
      "zone_id": "..."
    }
  ],
  "estimated_completion": "Work should be completed within 45 minutes"
}
```

### 3. Analyst Agent Output

```json
{
  "explanation": "The system prioritized this incident due to critical severity level, proximity to residential area, and potential public health impact. The waste overflow was detected by sensor readings exceeding threshold by 300%, indicating immediate action is required.",
  "key_factors": [
    "Critical severity level (priority score: 100)",
    "High public health risk in residential zone",
    "Sensor confidence: 81%",
    "Historical pattern of similar incidents in this location"
  ],
  "recommendations": [
    "Consider larger capacity bins for this high-traffic location",
    "Increase collection frequency during peak periods",
    "Install additional monitoring sensors"
  ],
  "confidence": 0.87
}
```

## Integration with Frontend

The frontend dashboard displays:

- **Agent Console**: Real-time agent messages and reasoning
- **Work Orders Panel**: Created work orders with status
- **Explanation Cards**: Human-readable explanations for each decision
- **Map Markers**: Visual representation of incidents and assigned units

## Troubleshooting

### "Cannot connect to Agent Runtime"

```bash
# Make sure it's running
cd agent-runtime
python main.py
```

### "Cannot connect to Backend"

```bash
# Make sure backend is running
cd backend
npm run dev
```

### "OpenAI API error"

Check your `.env` file has a valid OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-key-here
```

### "No incidents found"

The backend should have seeded data. If not, incidents will be created as sensors detect anomalies.

## Next Steps

1. **View in Frontend**: Open the dashboard to see agent activity visually
2. **Test Different Scenarios**: Try different incident types (waste, lighting, water, traffic)
3. **Monitor Real-time**: Watch agent logs as they process incidents
4. **Pattern Analysis**: Use the patterns endpoint to get insights across multiple incidents

## API Reference

All endpoints are documented at: http://localhost:8000/docs (FastAPI auto-generated docs)

Key endpoints:

- `POST /api/agents/process-incident` - Main workflow trigger
- `GET /api/agents/incident/{id}/status` - Check processing status
- `GET /api/agents/logs` - View agent reasoning logs
- `GET /api/agents/patterns` - Analyze incident patterns
- `GET /api/agents/conversation/{id}` - View agent conversation

## Demo Tips

For presentations:

1. Start with a high-priority incident (CRITICAL or HIGH severity)
2. Show the agent console in real-time as agents coordinate
3. Highlight the explanation to demonstrate AI transparency
4. Show the work order being created and assigned
5. Run pattern analysis to show insights across multiple incidents

This demonstrates autonomous incident response with full explainability!
