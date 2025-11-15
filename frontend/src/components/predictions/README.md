# Predictions Components

This directory contains all components related to prediction visualization and management in the CivicPulse AI platform.

## Components

### PredictionCard

A card component that displays a single prediction with:

- Sensor name and type
- Predicted value and time horizon
- Confidence level with color-coded badge
- Mini trend chart (sparkline) showing historical data
- Warning indicator for high-risk predictions
- Prediction range (lower/upper bounds)

**Props:**

- `prediction`: Prediction object
- `sensor`: Optional sensor object for additional context
- `historicalData`: Array of historical values for trend visualization
- `onSelect`: Callback when card is clicked
- `isSelected`: Boolean indicating if card is currently selected

### PredictionList

A virtualized list component that displays all predictions with:

- Filtering by sensor type, confidence threshold, and time horizon
- Sorting by confidence, time, or predicted value
- Virtual scrolling for performance with large datasets
- Real-time updates via WebSocket integration
- Empty state handling

**Props:**

- `onPredictionSelect`: Callback when a prediction is selected

### PredictionFilters

Filter controls for predictions including:

- Sensor type dropdown (WASTE, LIGHT, WATER, TRAFFIC, ENVIRONMENT, NOISE)
- Minimum confidence threshold slider
- Time horizon selector (1h, 6h, 12h, 24h)
- Apply and clear filter buttons

**Props:**

- `onFilterChange`: Callback with filter object
- `onClearFilters`: Callback to reset all filters

### PredictionDetail

Detailed view of a single prediction with:

- Key metrics (predicted value, confidence, time until, range)
- Historical vs predicted values chart
- Confidence interval visualization
- Model information (version, generation timestamp)
- Sensor details and current status

**Props:**

- `prediction`: Prediction object
- `sensor`: Optional sensor object
- `historicalReadings`: Array of historical sensor readings
- `onClose`: Callback to close the detail view

### PredictionTimeline

Timeline visualization showing predictions grouped by time horizon:

- Groups predictions into 1h, 6h, 12h, and 24h horizons
- Highlights high-risk predictions with warning badges
- Shows prediction count per time horizon
- Clickable predictions to view details
- Summary statistics

**Props:**

- `predictions`: Array of predictions
- `sensors`: Array of sensors for context
- `onPredictionClick`: Callback when a prediction is clicked

## Map Integration

### PredictionHeatmapLayer

Map layer component that visualizes prediction risk as a heatmap:

- Shows risk areas based on predicted values and confidence
- Color gradient from yellow (low risk) to red (high risk)
- Only displays predictions with confidence >= 60%
- Adjusts intensity and radius based on zoom level
- Automatically updates when predictions change

**Props:**

- `map`: Mapbox map instance
- `predictions`: Array of predictions
- `sensors`: Array of sensors for location data
- `visible`: Boolean to show/hide the layer

### Prediction Markers

Diamond-shaped markers on the map for individual predictions:

- Color-coded by sensor type
- Warning pulse animation for high-risk predictions
- Confidence indicator badge (percentage)
- Hover effects for interactivity
- Created via `createPredictionMarker()` function in `markers.tsx`

## Usage Example

```tsx
import { Predictions } from "@/pages/Predictions";

// The Predictions page integrates all components:
// - PredictionList for browsing predictions
// - PredictionTimeline for temporal overview
// - PredictionDetail modal for detailed view
// - Map integration for spatial visualization

function App() {
  return <Predictions />;
}
```

## Features Implemented

### Task 20.1: PredictionList Component ✅

- Prediction cards with sensor info, predicted value, confidence, and time horizon
- Confidence level indicators (color-coded: green >= 80%, yellow >= 60%, red < 60%)
- Filtering by sensor type and confidence threshold
- Mini trend charts showing historical data
- Virtual scrolling for performance

### Task 20.2: PredictionDetail Component ✅

- Full forecast information display
- Confidence intervals (upper/lower bounds)
- Historical data vs predicted values chart
- Model version and generation timestamp
- Sensor details and current status
- Interactive charts using Recharts

### Task 20.3: Map Integration ✅

- Prediction markers on map with warning indicators
- Prediction heatmap overlay showing risk areas
- Prediction timeline showing when issues are predicted
- Color-coded markers by sensor type
- Confidence badges on markers

## Data Flow

1. **Fetch Predictions**: API call to `/api/v1/predictions`
2. **Store Management**: Zustand store (`usePredictionStore`)
3. **Real-time Updates**: WebSocket events for new predictions
4. **Filtering**: Client-side filtering by type, confidence, time
5. **Visualization**: Cards, charts, maps, and timelines

## Styling

All components use:

- Tailwind CSS for styling
- Dark mode support
- Responsive design
- Framer Motion for animations
- Recharts for data visualization
- Consistent color scheme with the rest of the application

## Requirements Satisfied

- **Requirement 4.1**: Forecasting for time horizons between 1 and 24 hours ✅
- **Requirement 4.2**: Predictions for various sensor types ✅
- **Requirement 4.3**: Confidence scores and intervals ✅
- **Requirement 4.5**: Model version tracking ✅
