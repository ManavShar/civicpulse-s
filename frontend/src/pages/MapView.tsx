import { useMemo } from "react";
import { MapPerformanceWrapper } from "@/components/map";
import { useSensorStore } from "@/stores/sensorStore";
import { useIncidentStore } from "@/stores/incidentStore";

export function MapView() {
  const sensors = useSensorStore((state) => state.sensors);
  const allIncidents = useIncidentStore((state) => state.incidents);

  // Filter active incidents with useMemo to avoid infinite loop
  const incidents = useMemo(() => {
    return Array.isArray(allIncidents)
      ? allIncidents.filter((i) => i.status === "ACTIVE")
      : [];
  }, [allIncidents]);

  const handleMarkerClick = (id: string, type: "sensor" | "incident") => {
    console.log(`Clicked ${type}:`, id);
    // TODO: Implement marker click handling (e.g., show details panel)
  };

  const handleIncidentViewDetails = (incidentId: string) => {
    console.log("View incident details:", incidentId);
    // TODO: Navigate to incident details or open modal
  };

  return (
    <div className="h-full w-full">
      <MapPerformanceWrapper
        sensors={sensors}
        incidents={incidents}
        onMarkerClick={handleMarkerClick}
        onIncidentViewDetails={handleIncidentViewDetails}
        showLegend={true}
      />
    </div>
  );
}
