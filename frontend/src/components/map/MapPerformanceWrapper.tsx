import { useEffect, useRef, useMemo } from "react";
import { Sensor, Incident } from "@/types";
import { MapContainer } from "./MapContainer";
import { getChangedMarkers } from "./useMapPerformance";

interface MapPerformanceWrapperProps {
  sensors: Sensor[];
  incidents: Incident[];
  [key: string]: any;
}

/**
 * Performance wrapper for MapContainer that optimizes updates
 */
export function MapPerformanceWrapper({
  sensors,
  incidents,
  ...props
}: MapPerformanceWrapperProps) {
  const prevSensorsRef = useRef<Sensor[]>([]);
  const prevIncidentsRef = useRef<Incident[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize sensors and incidents to prevent unnecessary re-renders
  const memoizedSensors = useMemo(() => {
    // Skip if no sensors
    if (sensors.length === 0) {
      prevSensorsRef.current = [];
      return [];
    }

    // First time or no previous sensors
    if (prevSensorsRef.current.length === 0) {
      prevSensorsRef.current = sensors;
      return sensors;
    }

    const changes = getChangedMarkers(prevSensorsRef.current, sensors);

    // Only update if there are actual changes
    if (
      changes.added.length > 0 ||
      changes.removed.length > 0 ||
      changes.updated.length > 0
    ) {
      prevSensorsRef.current = sensors;
      return sensors;
    }

    return prevSensorsRef.current;
  }, [sensors]);

  const memoizedIncidents = useMemo(() => {
    // Skip if no incidents
    if (incidents.length === 0) {
      prevIncidentsRef.current = [];
      return [];
    }

    // First time or no previous incidents
    if (prevIncidentsRef.current.length === 0) {
      prevIncidentsRef.current = incidents;
      return incidents;
    }

    const changes = getChangedMarkers(prevIncidentsRef.current, incidents);

    // Only update if there are actual changes
    if (
      changes.added.length > 0 ||
      changes.removed.length > 0 ||
      changes.updated.length > 0
    ) {
      prevIncidentsRef.current = incidents;
      return incidents;
    }

    return prevIncidentsRef.current;
  }, [incidents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <MapContainer
      sensors={memoizedSensors}
      incidents={memoizedIncidents}
      {...props}
    />
  );
}
