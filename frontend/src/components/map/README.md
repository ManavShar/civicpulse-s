# Map Components

This directory contains all map-related components for the CivicPulse AI Digital Twin Dashboard.

## Components

### MapContainer

The main map component that renders the Mapbox GL JS map with sensors, incidents, and interactive features.

**Props:**

- `sensors`: Array of sensor objects to display
- `incidents`: Array of incident objects to display
- `zones`: Array of zone boundaries (optional)
- `heatmapData`: Sensor readings for heatmap visualization (optional)
- `selectedZone`: ID of the currently selected zone (optional)
- `onMarkerClick`: Callback when a marker is clicked
- `onZoneClick`: Callback when a zone is clicked
- `onIncidentViewDetails`: Callback to view incident details
- `center`: Initial map center coordinates (default: San Francisco)
- `zoom`: Initial zoom level (default: 12)
- `showLegend`: Whether to show the map legend (default: true)

### MapPerformanceWrapper

A performance-optimized wrapper around MapContainer that prevents unnecessary re-renders.

**Usage:**

```tsx
<MapPerformanceWrapper
  sensors={sensors}
  incidents={incidents}
  onMarkerClick={handleMarkerClick}
/>
```

### HeatmapLayer

Renders a heatmap overlay for sensor data visualization.

**Types:**

- `temperature`: Environmental temperature data
- `noise`: Noise level data
- `traffic`: Traffic density data
- `waste`: Waste level data

### HeatmapControl

UI control for selecting and configuring heatmap visualization.

### ZoneOverlay

Renders zone boundaries with interactive hover and selection states.

### MapLegend

Displays a legend explaining marker types and colors.

### MarkerPopup

Popup components for displaying sensor and incident details.

## Performance Optimizations

### 1. Marker Virtualization

Only markers within the current viewport (plus padding) are rendered. This significantly improves performance with large datasets.

### 2. Marker Clustering

Sensors are automatically clustered at lower zoom levels to reduce visual clutter and improve performance.

**Configuration:**

- Cluster distance: 60 pixels
- Min zoom for clustering: 12

### 3. Debounced Updates

Map move and zoom events are debounced to prevent excessive re-renders during user interaction.

### 4. Efficient Marker Updates

The system tracks marker changes and only updates markers that have been added, removed, or modified.

### 5. Batch Updates

Multiple marker updates are batched together to minimize DOM operations.

### 6. Memoization

Sensor and incident arrays are memoized to prevent unnecessary re-renders when data hasn't actually changed.

### 7. Progressive Loading

Historical data can be loaded progressively in batches to prevent blocking the UI.

## Utilities

### useMapPerformance.ts

Contains performance optimization hooks and utilities:

- `useDebounce`: Debounce hook for map events
- `useThrottle`: Throttle hook for high-frequency events
- `useAnimationFrame`: Request animation frame hook for smooth updates
- `BatchUpdater`: Class for batching multiple updates
- `getMarkersInViewport`: Filter markers to only those in viewport
- `getChangedMarkers`: Efficiently detect marker changes
- `ProgressiveLoader`: Load data progressively in batches

## Setup

### Environment Variables

Set the Mapbox access token in your `.env` file:

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Mapbox Styles

The map uses the `mapbox://styles/mapbox/dark-v11` style by default. You can customize this in `MapContainer.tsx`.

## Examples

### Basic Usage

```tsx
import { MapContainer } from "@/components/map";

function Dashboard() {
  const sensors = useSensorStore((state) => state.sensors);
  const incidents = useIncidentStore((state) => state.incidents);

  return (
    <MapContainer
      sensors={sensors}
      incidents={incidents}
      onMarkerClick={(id, type) => {
        console.log(`Clicked ${type} ${id}`);
      }}
    />
  );
}
```

### With Performance Wrapper

```tsx
import { MapPerformanceWrapper } from "@/components/map";

function Dashboard() {
  const sensors = useSensorStore((state) => state.sensors);
  const incidents = useIncidentStore((state) => state.incidents);

  return (
    <MapPerformanceWrapper
      sensors={sensors}
      incidents={incidents}
      onMarkerClick={(id, type) => {
        console.log(`Clicked ${type} ${id}`);
      }}
    />
  );
}
```

### With Heatmap

```tsx
import { MapContainer } from "@/components/map";

function Dashboard() {
  const sensors = useSensorStore((state) => state.sensors);
  const incidents = useIncidentStore((state) => state.incidents);
  const readings = useSensorStore((state) => state.recentReadings);

  return (
    <MapContainer
      sensors={sensors}
      incidents={incidents}
      heatmapData={readings}
      onMarkerClick={(id, type) => {
        console.log(`Clicked ${type} ${id}`);
      }}
    />
  );
}
```

### With Zones

```tsx
import { MapContainer } from "@/components/map";

function Dashboard() {
  const sensors = useSensorStore((state) => state.sensors);
  const incidents = useIncidentStore((state) => state.incidents);
  const zones = useZoneStore((state) => state.zones);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <MapContainer
      sensors={sensors}
      incidents={incidents}
      zones={zones}
      selectedZone={selectedZone}
      onZoneClick={setSelectedZone}
      onMarkerClick={(id, type) => {
        console.log(`Clicked ${type} ${id}`);
      }}
    />
  );
}
```

## Customization

### Custom Marker Icons

Edit `markers.tsx` to customize sensor and incident marker appearance.

### Custom Heatmap Colors

Edit `HeatmapLayer.tsx` to customize heatmap color ramps for different data types.

### Custom Map Style

Change the map style in `MapContainer.tsx`:

```tsx
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: "mapbox://styles/mapbox/light-v11", // or your custom style
  center,
  zoom,
});
```

## Performance Tips

1. **Use MapPerformanceWrapper** for large datasets (>100 markers)
2. **Enable clustering** for sensor markers (enabled by default)
3. **Limit heatmap data** to recent readings only
4. **Use viewport filtering** when fetching data from API
5. **Debounce marker updates** when receiving real-time data
6. **Batch WebSocket updates** to prevent excessive re-renders

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires WebGL)
- Mobile browsers: Supported with touch controls

## Dependencies

- `mapbox-gl`: ^3.16.0
- `react`: ^19.2.0
- `date-fns`: ^4.1.0 (for date formatting in popups)
