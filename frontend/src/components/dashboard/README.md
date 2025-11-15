# Dashboard Components

This directory contains the KPI and metrics visualization components for the CivicPulse AI dashboard.

## Components

### MetricCard

A reusable card component for displaying key performance indicators with animated values, trend indicators, and sparklines.

**Props:**

- `label`: Metric label
- `value`: Current metric value (number or string)
- `unit`: Optional unit suffix
- `trend`: Trend direction ('up', 'down', 'stable')
- `trendValue`: Percentage change
- `sparklineData`: Array of historical values for sparkline
- `colorScheme`: Visual theme ('default', 'success', 'warning', 'danger')
- `icon`: Optional icon component
- `loading`: Loading state

**Features:**

- Animated number transitions using Framer Motion
- Color-coded based on metric thresholds
- Trend indicators with icons
- Integrated sparkline charts

### Sparkline

A minimal line chart component for showing metric trends.

**Props:**

- `data`: Array of numeric values
- `color`: Line color (CSS class)
- `strokeWidth`: Line thickness
- `animate`: Enable/disable animation

### KPIDashboard

A grid layout displaying key system metrics with automatic trend calculation.

**Props:**

- `metrics`: Current system metrics
- `metricsHistory`: Historical metrics for trend calculation
- `loading`: Loading state

**Displays:**

- Active Incidents count
- Active Predictions count
- Work Orders count
- Overall Risk Level

### SystemMetrics

Displays detailed system metrics including severity breakdown and zone status.

**Props:**

- `metrics`: Current system metrics
- `incidents`: Array of incidents for severity breakdown
- `loading`: Loading state

**Features:**

- Animated bar charts for severity breakdown
- Zone status summary with icons
- Real-time updates via WebSocket

### SensorTimeSeriesChart

Line chart for displaying sensor readings over time using Recharts.

**Props:**

- `readings`: Array of sensor readings
- `title`: Chart title
- `height`: Chart height in pixels
- `showLegend`: Show/hide legend

**Features:**

- Time-formatted X-axis
- Custom tooltips with detailed information
- Responsive design

### IncidentDistributionChart

Bar chart showing incident distribution by category.

**Props:**

- `incidents`: Array of incidents
- `title`: Chart title
- `height`: Chart height in pixels

**Features:**

- Color-coded bars by incident type
- Custom tooltips
- Total incident count display

### PredictionConfidenceChart

Area chart displaying predictions with confidence intervals.

**Props:**

- `predictions`: Array of predictions
- `historicalValues`: Optional historical data
- `title`: Chart title
- `height`: Chart height in pixels

**Features:**

- Confidence interval shading
- Separate lines for actual vs predicted values
- Dashed line for predictions
- Gradient fill for confidence bounds

## Usage Example

```tsx
import {
  KPIDashboard,
  SystemMetrics,
  SensorTimeSeriesChart,
  IncidentDistributionChart,
  PredictionConfidenceChart,
} from "@/components/dashboard";

function Dashboard() {
  const { metrics, history } = useMetricsStore();
  const { incidents } = useIncidentStore();
  const { sensors } = useSensorStore();
  const { predictions } = usePredictionStore();

  return (
    <div className="space-y-6">
      <KPIDashboard metrics={metrics} metricsHistory={history} />
      <SystemMetrics metrics={metrics} incidents={incidents} />
      <IncidentDistributionChart incidents={incidents} />
      <SensorTimeSeriesChart readings={sensorReadings} />
      <PredictionConfidenceChart predictions={predictions} />
    </div>
  );
}
```

## Dependencies

- **Recharts**: Chart library for data visualizations
- **Framer Motion**: Animation library for smooth transitions
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities

## Styling

All components use Tailwind CSS for styling with support for dark mode. Color schemes are consistent with the design system:

- Blue: Default/Info
- Green: Success/Healthy
- Yellow: Warning
- Red: Danger/Critical

## Real-time Updates

Components are designed to work with Zustand stores and automatically update when:

- New metrics are received via WebSocket
- Incidents are created/updated
- Predictions are generated
- Sensor readings arrive

## Performance Considerations

- Sparklines use memoization to avoid unnecessary recalculations
- Charts use ResponsiveContainer for proper sizing
- Trend calculations are memoized
- Animations are optimized with Framer Motion
