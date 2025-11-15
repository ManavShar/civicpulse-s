# Scenario Demonstration System

The Scenario Demonstration System allows you to trigger pre-configured city events for demonstration purposes. Each scenario modifies sensor behavior and creates triggered incidents to simulate real-world urban events.

## Available Scenarios

### 1. Flash Flood Event (`flood`)

- **Duration**: 5 minutes
- **Description**: Sudden heavy rainfall causing localized flooding
- **Effects**:
  - Water pressure increases by 2.5x
  - Temperature drops by 5°C
  - Traffic congestion increases by 1.8x
- **Triggered Incidents**:
  - Flash flood warning (30s delay)
  - Road closure due to flooding (1m delay)

### 2. Fire Emergency (`fire`)

- **Duration**: 4 minutes
- **Description**: Fire outbreak in commercial district
- **Effects**:
  - Temperature spikes by +25°C
  - Noise levels increase by +30dB
  - Traffic increases by 2.2x around emergency zone
- **Triggered Incidents**:
  - Fire detected (15s delay)
  - Air quality alert (45s delay)
  - Emergency route clearance (30s delay)

### 3. Major Traffic Congestion (`traffic-congestion`)

- **Duration**: 6 minutes
- **Description**: Severe traffic congestion during peak hours
- **Effects**:
  - Traffic volume increases by 3.5x
  - Noise pollution increases by +20dB
  - Temperature rises by +3°C from emissions
- **Triggered Incidents**:
  - Major gridlock (45s delay)
  - Traffic signal failure (1.5m delay)

### 4. Extreme Heat Wave (`heat-wave`)

- **Duration**: 7 minutes
- **Description**: Prolonged period of excessive heat
- **Effects**:
  - Temperature increases by +15°C
  - Water pressure drops to 70% (high demand)
  - Traffic reduces to 80% (people avoid travel)
- **Triggered Incidents**:
  - Heat advisory (30s delay)
  - Water shortage warning (2m delay)

### 5. Power Outage (`power-outage`)

- **Duration**: 5 minutes
- **Description**: Widespread power outage affecting multiple zones
- **Effects**:
  - Street lighting drops to 10%
  - Traffic increases by 1.5x (signal failures)
  - Ambient noise reduces by -10dB
- **Triggered Incidents**:
  - Power outage alert (10s delay)
  - Traffic signals offline (20s delay)
  - Street lighting failure (15s delay)

## API Endpoints

### Get All Scenarios

```
GET /api/v1/scenarios
```

Returns a list of all available scenarios with their configurations.

**Response:**

```json
{
  "scenarios": [
    {
      "id": "flood",
      "name": "Flash Flood Event",
      "description": "...",
      "duration": 300000,
      "sensorModifiers": [...],
      "triggeredIncidents": [...],
      "metadata": {
        "icon": "🌊",
        "color": "#3B82F6"
      }
    }
  ],
  "count": 5
}
```

### Get Specific Scenario

```
GET /api/v1/scenarios/:id
```

Returns details for a specific scenario.

### Get Scenario Status

```
GET /api/v1/scenarios/status/current
```

Returns the current scenario status, including active scenario details if one is running.

**Response (inactive):**

```json
{
  "active": false
}
```

**Response (active):**

```json
{
  "active": true,
  "scenario": {
    "id": "flood",
    "name": "Flash Flood Event",
    "description": "...",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:00.000Z",
    "elapsedTime": 45000,
    "remainingTime": 255000,
    "triggeredIncidents": 2
  }
}
```

### Trigger Scenario

```
POST /api/v1/scenarios/:id/trigger
```

Triggers a scenario by ID. Only one scenario can be active at a time.

**Response:**

```json
{
  "message": "Scenario 'Flash Flood Event' triggered successfully",
  "scenario": {
    "id": "flood",
    "name": "Flash Flood Event",
    "description": "...",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:00.000Z",
    "duration": 300000,
    "status": "ACTIVE"
  }
}
```

**Error (scenario already active):**

```json
{
  "error": {
    "code": "SCENARIO_ALREADY_ACTIVE",
    "message": "Scenario 'Flash Flood Event' is already active. Stop it before starting a new one.",
    "activeScenario": {
      "id": "flood",
      "name": "Flash Flood Event",
      "startTime": "2024-01-15T10:30:00.000Z",
      "endTime": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### Stop Scenario

```
POST /api/v1/scenarios/stop
```

Stops the currently active scenario and restores normal sensor behavior.

**Response:**

```json
{
  "message": "Scenario 'Flash Flood Event' stopped successfully"
}
```

## WebSocket Events

The scenario system broadcasts real-time events via WebSocket:

### `scenario:started`

Emitted when a scenario is triggered.

```json
{
  "scenario": {
    "id": "flood",
    "name": "Flash Flood Event",
    "description": "...",
    "duration": 300000,
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:00.000Z"
  }
}
```

### `scenario:stopped`

Emitted when a scenario is stopped (manually or automatically).

```json
{
  "scenario": {
    "id": "flood",
    "name": "Flash Flood Event",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:00.000Z",
    "triggeredIncidents": 2
  }
}
```

## How It Works

1. **Sensor Modification**: When a scenario is triggered, the system applies modifiers to matching sensors based on type, ID, or zone. Original sensor configurations are stored for restoration.

2. **Incident Scheduling**: Triggered incidents are scheduled with specific delays. These incidents are created automatically at the specified times with high confidence scores.

3. **Automatic Cleanup**: When a scenario ends (either by timeout or manual stop), all sensor configurations are restored to their original values.

4. **State Management**: Only one scenario can be active at a time. Attempting to trigger a second scenario will fail with a 409 Conflict error.

## Testing

A test script is provided to verify the scenario API:

```bash
# Start the backend server first
npm run dev --prefix backend

# In another terminal, run the test
npx ts-node backend/test-scenario-api.ts
```

## Implementation Details

- **Service**: `ScenarioService` (`backend/src/services/ScenarioService.ts`)
- **Types**: `backend/src/types/scenario.ts`
- **Routes**: `backend/src/routes/scenarios.ts`
- **Predefined Scenarios**: Defined in `PREDEFINED_SCENARIOS` constant

## Future Enhancements

- Custom scenario creation via API
- Scenario templates with variable parameters
- Scenario history and analytics
- Multi-zone scenario targeting
- Scenario chaining and sequences
