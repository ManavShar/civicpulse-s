import { useReplayStore } from "../stores/replayStore";
import { useReplayData } from "../hooks/useReplayData";
import { TimelineReplay } from "../components/replay/TimelineReplay";
import { ReplayControls } from "../components/replay/ReplayControls";
import { ReplayEventTimeline } from "../components/replay/ReplayEventTimeline";
import { MapContainer } from "../components/map/MapContainer";
import { KPIDashboard } from "../components/dashboard/KPIDashboard";
import { IncidentList } from "../components/incidents/IncidentList";
import { WorkOrderList } from "../components/workorders/WorkOrderList";
import { useSensorStore } from "../stores/sensorStore";
import { useMetricsStore } from "../stores/metricsStore";

export function Replay() {
  const { isReplayMode, currentTime, currentSnapshot } = useReplayStore();
  const { sensors } = useSensorStore();
  const { metrics } = useMetricsStore();

  // Initialize replay data hook
  useReplayData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Replay & Timeline
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review historical incidents and system events
          </p>
        </div>
        <ReplayControls />
      </div>

      {!isReplayMode ? (
        /* Welcome Screen */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Replay Historical Events
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select a time range to replay past incidents, sensor readings,
              work orders, and agent activities. Watch how the system responded
              to events in real-time.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Features:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Scrub through timeline to see system state at any point
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Adjust playback speed from 0.5x to 10x for faster analysis
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    Filter events by type (sensors, incidents, work orders,
                    agents)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    View synchronized map, charts, and data during replay
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Replay Mode Active */
        <div className="space-y-6">
          {/* Timeline Controls */}
          <TimelineReplay />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Map and KPIs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="h-[500px]">
                  <MapContainer
                    sensors={sensors}
                    incidents={currentSnapshot?.incidents || []}
                    selectedZone={null}
                    onMarkerClick={(id) => console.log("Marker clicked:", id)}
                  />
                </div>
              </div>

              {/* KPI Dashboard */}
              <KPIDashboard metrics={currentSnapshot?.metrics || metrics} />

              {/* Incidents */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Active Incidents at {currentTime?.toLocaleTimeString()}
                </h3>
                <IncidentList
                  onIncidentSelect={(id) => console.log("Incident:", id)}
                />
              </div>

              {/* Work Orders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Work Orders
                </h3>
                <WorkOrderList
                  onWorkOrderSelect={(id) => console.log("Work Order:", id)}
                />
              </div>
            </div>

            {/* Right Column - Event Timeline */}
            <div className="lg:col-span-1">
              <ReplayEventTimeline />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
