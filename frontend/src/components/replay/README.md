# Replay Components

This directory contains components for the replay and timeline functionality of CivicPulse AI.

## Components

### TimelineReplay

The main timeline control component that provides:

- Interactive timeline scrubber with event markers
- Playback controls (play, pause, skip forward/backward)
- Playback speed adjustment (0.5x to 10x)
- Current time display
- Replay mode indicator

**Usage:**

```tsx
import { TimelineReplay } from "./components/replay";

<TimelineReplay onTimeChange={(time) => console.log("Time changed:", time)} />;
```

### ReplayControls

Component for entering and exiting replay mode:

- Date/time range selector
- Quick select buttons (Last Hour, Last 6 Hours, Last 24 Hours)
- Enter/Exit replay mode buttons

**Usage:**

```tsx
import { ReplayControls } from "./components/replay";

<ReplayControls />;
```

### ReplayEventTimeline

Event visualization component that displays:

- Filterable event list by type (Sensor, Incident, Work Order, Agent)
- Event details with expandable panels
- Event type indicators and counts
- Synchronized with current replay time

**Usage:**

```tsx
import { ReplayEventTimeline } from "./components/replay";

<ReplayEventTimeline />;
```

## State Management

### useReplayStore

Zustand store for replay state:

- `isReplayMode`: Boolean indicating if replay mode is active
- `isPlaying`: Boolean indicating if playback is active
- `playbackSpeed`: Current playback speed multiplier
- `events`: Array of timeline events
- `startTime`, `endTime`, `currentTime`: Time range and position
- `currentSnapshot`: System snapshot at current time

### useReplayData Hook

Custom hook for fetching and synchronizing replay data:

- Automatically fetches timeline data when time range changes
- Fetches snapshots when current time changes
- Caches data to reduce API calls
- Synchronizes all stores (sensors, incidents, work orders, agents) with snapshot data

**Usage:**

```tsx
import { useReplayData } from "../hooks/useReplayData";

function MyComponent() {
  const { fetchTimeline, fetchSnapshot } = useReplayData();

  // Data is automatically fetched and synchronized
  // Manual fetching is also available if needed
}
```

## Features

### Timeline Scrubber

- Click or drag to navigate to any point in time
- Visual event markers show when events occurred
- Color-coded markers by event type:
  - Red: Incidents
  - Green: Work Orders
  - Purple: Agent Messages
  - Gray: Sensor Readings

### Playback Controls

- Play/Pause button
- Skip backward/forward (1 minute increments)
- Speed control dropdown (0.5x, 1x, 2x, 5x, 10x)

### Event Filtering

- Filter by event type (All, Sensor, Incident, Work Order, Agent)
- Event counts displayed for each type
- Expandable event details

### Data Synchronization

- All stores are synchronized with the current replay time
- Map, charts, and lists update automatically
- Smooth transitions between replay states
- Efficient caching to minimize API calls

## API Integration

The replay components integrate with the following API endpoints:

- `GET /api/v1/replay/timeline` - Fetch timeline events for a time range
- `GET /api/v1/replay/snapshot/:timestamp` - Fetch system snapshot at specific time

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **9.1**: Replay Engine reconstructs incident timelines from historical data
- **9.2**: Supports playback speeds between 0.5x and 10x
- **9.3**: Timeline scrubber allows navigation to any point in history
- **9.4**: Visual indicator shows current replay timestamp
- **9.5**: Synchronizes map markers, charts, and agent logs during playback
