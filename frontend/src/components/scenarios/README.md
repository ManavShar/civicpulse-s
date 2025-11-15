# Scenario Components

This directory contains components for the demonstration scenario system in CivicPulse AI.

## Components

### ScenarioPanel

Main component that displays available scenarios and allows triggering them.

**Features:**

- Displays scenario cards in a grid layout
- Shows active scenario status with countdown timer
- Handles scenario triggering and stopping
- Polls for scenario status updates every 2 seconds
- Error handling and loading states

**Usage:**

```tsx
import { ScenarioPanel } from "@/components/scenarios";

function ScenariosPage() {
  return <ScenarioPanel />;
}
```

### ScenarioCard

Individual scenario card component displaying scenario information and trigger button.

**Props:**

- `scenario`: Scenario object with id, name, description, duration, icon
- `isActive`: Boolean indicating if this scenario is currently active
- `onTrigger`: Callback function when trigger button is clicked
- `disabled`: Boolean to disable the trigger button

**Features:**

- Animated pulse effect when active
- Duration display
- Scenario icon
- Disabled state when another scenario is active

### ScenarioStatus

Status display for the currently active scenario with countdown timer.

**Props:**

- `scenarioName`: Name of the active scenario
- `startTime`: Scenario start timestamp
- `endTime`: Scenario end timestamp
- `onStop`: Callback function to stop the scenario

**Features:**

- Real-time countdown timer
- Progress bar showing elapsed/remaining time
- Stop scenario button
- Updates every second

### ScenarioOverlay

Global overlay component that provides visual effects when a scenario is active.

**Features:**

- Full-screen tinted overlay with scenario-specific colors
- Animated corner indicators
- Floating status badge with countdown
- Smooth fade-in/fade-out animations
- Scenario-specific color schemes:
  - Flood: Blue tint
  - Fire: Red tint
  - Traffic Congestion: Orange tint
  - Heat Wave: Orange-red tint
  - Power Outage: Purple tint with desaturation

**Usage:**

```tsx
// Add to App.tsx or root layout
import { ScenarioOverlay } from "@/components/scenarios";

function App() {
  return (
    <>
      <ScenarioOverlay />
      {/* Rest of app */}
    </>
  );
}
```

## State Management

The scenario system uses Zustand for state management via `useScenarioStore`:

```tsx
import { useScenarioStore } from "@/stores/scenarioStore";

function MyComponent() {
  const { activeScenario, setActiveScenario, isScenarioActive } =
    useScenarioStore();

  // activeScenario contains current scenario info or null
  // setActiveScenario updates the active scenario
  // isScenarioActive() returns boolean
}
```

## WebSocket Integration

Scenario events are handled via WebSocket:

- `scenario:started` - Fired when a scenario is triggered
- `scenario:stopped` - Fired when a scenario ends or is stopped

These events automatically update the scenario store.

## API Integration

The scenario system integrates with the backend API:

```tsx
import { apiClient } from "@/lib/api";

// Get all available scenarios
const scenarios = await apiClient.scenarios.getAll();

// Get current scenario status
const status = await apiClient.scenarios.getStatus();

// Trigger a scenario
await apiClient.scenarios.trigger(scenarioId);

// Stop active scenario
await apiClient.scenarios.stop();
```

## Styling

Scenarios use Tailwind CSS with custom animations:

- Pulse animations for active states
- Smooth transitions for overlays
- Scenario-specific color schemes
- Dark mode support

## Map Integration

Use the `useScenarioMapStyle` hook to apply scenario-specific styling to map components:

```tsx
import { useScenarioMapStyle } from "@/hooks/useScenarioMapStyle";

function MapComponent() {
  const mapStyle = useScenarioMapStyle();

  return <div style={mapStyle}>{/* Map content */}</div>;
}
```

This applies visual filters and background colors based on the active scenario.
