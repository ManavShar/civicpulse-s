import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Sensor,
  Incident,
  WorkOrder,
  GeoPoint,
  SensorReading,
  Zone,
} from "@/types";
import {
  createSensorMarker,
  createIncidentMarker,
  createWorkOrderMarker,
} from "./markers";
import { MarkerCluster } from "./MarkerCluster";
import { HeatmapLayer, HeatmapType } from "./HeatmapLayer";
import { HeatmapControl } from "./HeatmapControl";
import { SensorPopup, IncidentPopup, WorkOrderPopup } from "./MarkerPopup";
import { ZoneOverlay } from "./ZoneOverlay";
import { MapLegend } from "./MapLegend";

// Mapbox access token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

interface MapContainerProps {
  sensors: Sensor[];
  incidents: Incident[];
  workOrders?: WorkOrder[];
  zones?: Zone[];
  heatmapData?: SensorReading[];
  selectedZone?: string | null;
  onMarkerClick?: (
    id: string,
    type: "sensor" | "incident" | "workorder"
  ) => void;
  onZoneClick?: (zoneId: string) => void;
  onIncidentViewDetails?: (incidentId: string) => void;
  onWorkOrderViewDetails?: (workOrderId: string) => void;
  center?: [number, number];
  zoom?: number;
  showLegend?: boolean;
  showWorkOrders?: boolean;
}

export function MapContainer({
  sensors,
  incidents,
  workOrders = [],
  zones = [],
  heatmapData = [],
  selectedZone,
  onMarkerClick,
  onZoneClick,
  onIncidentViewDetails,
  onWorkOrderViewDetails,
  center = [55.2708, 25.2048], // Default to Dubai, UAE
  zoom = 12,
  showLegend = true,
  showWorkOrders = true,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const clusterRef = useRef<MarkerCluster | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapType, setHeatmapType] = useState<HeatmapType | null>(null);
  const [heatmapIntensity, setHeatmapIntensity] = useState(1);
  const [heatmapRadius, setHeatmapRadius] = useState(30);
  const [selectedMarker, setSelectedMarker] = useState<{
    id: string;
    type: "sensor" | "incident" | "workorder";
    coordinates: [number, number];
  } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.warn("Mapbox token not found. Map will not be initialized.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
      pitch: 45,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Add scale control
    map.current.addControl(
      new mapboxgl.ScaleControl({ unit: "imperial" }),
      "bottom-left"
    );

    map.current.on("load", () => {
      setMapLoaded(true);

      // Initialize marker clustering
      if (map.current) {
        clusterRef.current = new MarkerCluster(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  const updateSensorMarkers = useCallback(() => {
    if (!map.current || !clusterRef.current) return;

    // Safety check: ensure sensors is an array
    const sensorsArray = Array.isArray(sensors) ? sensors : [];

    console.log("Updating sensor markers:", {
      sensorsCount: sensorsArray.length,
      mapLoaded: mapLoaded,
      hasMap: !!map.current,
      hasCluster: !!clusterRef.current,
    });

    // Get existing sensor marker IDs
    const existingIds = new Set<string>();
    markersRef.current.forEach((_, id) => {
      if (id.startsWith("sensor-")) {
        existingIds.add(id);
      }
    });

    // Track current sensor IDs
    const currentIds = new Set(sensorsArray.map((s) => `sensor-${s.id}`));

    // Remove markers that no longer exist
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    // Add or update markers
    sensorsArray.forEach((sensor) => {
      // Check if sensor has valid location
      if (!sensor.location || !sensor.location.coordinates) {
        console.warn("Sensor missing location:", sensor.id);
        return;
      }

      const markerId = `sensor-${sensor.id}`;
      const existingMarker = markersRef.current.get(markerId);

      if (existingMarker) {
        // Update existing marker
        const element = existingMarker.getElement();
        const newElement = createSensorMarker(sensor, () =>
          handleMarkerClick(sensor.id, "sensor")
        );
        element.replaceWith(newElement);
      } else {
        // Create new marker
        const element = createSensorMarker(sensor, () =>
          handleMarkerClick(sensor.id, "sensor")
        );

        // Ensure coordinates are in [lng, lat] format
        const coords = Array.isArray(sensor.location.coordinates)
          ? sensor.location.coordinates
          : [sensor.location.coordinates[0], sensor.location.coordinates[1]];

        const marker = new mapboxgl.Marker({ element })
          .setLngLat(coords as [number, number])
          .addTo(map.current!);

        markersRef.current.set(markerId, marker);
        console.log("Added sensor marker:", markerId, coords);
      }
    });

    // Update clustering
    clusterRef.current.updateClusters(Array.from(markersRef.current.values()));
  }, [sensors]);

  const updateIncidentMarkers = useCallback(() => {
    if (!map.current) return;

    // Get existing incident marker IDs
    const existingIds = new Set<string>();
    markersRef.current.forEach((_, id) => {
      if (id.startsWith("incident-")) {
        existingIds.add(id);
      }
    });

    // Track current incident IDs
    const currentIds = new Set(incidents.map((i) => `incident-${i.id}`));

    // Remove markers that no longer exist
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    // Add or update markers
    incidents.forEach((incident) => {
      // Check if incident has valid location
      if (!incident.location || !incident.location.coordinates) {
        console.warn("Incident missing location:", incident.id);
        return;
      }

      const markerId = `incident-${incident.id}`;
      const existingMarker = markersRef.current.get(markerId);

      if (existingMarker) {
        // Update existing marker
        const element = existingMarker.getElement();
        const newElement = createIncidentMarker(incident, () =>
          handleMarkerClick(incident.id, "incident")
        );
        element.replaceWith(newElement);
      } else {
        // Create new marker
        const element = createIncidentMarker(incident, () =>
          handleMarkerClick(incident.id, "incident")
        );

        // Ensure coordinates are in [lng, lat] format
        const coords = Array.isArray(incident.location.coordinates)
          ? incident.location.coordinates
          : [0, 0]; // Fallback to [0, 0] if invalid

        const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(coords as [number, number])
          .addTo(map.current!);

        markersRef.current.set(markerId, marker);
        console.log("Added incident marker:", markerId, coords);
      }
    });
  }, [incidents]);

  const updateWorkOrderMarkers = useCallback(() => {
    if (!map.current) return;

    // Get existing work order marker IDs
    const existingIds = new Set<string>();
    markersRef.current.forEach((_, id) => {
      if (id.startsWith("workorder-")) {
        existingIds.add(id);
      }
    });

    // Track current work order IDs
    const currentIds = new Set(workOrders.map((wo) => `workorder-${wo.id}`));

    // Remove markers that no longer exist
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    // Add or update markers
    workOrders.forEach((workOrder) => {
      const markerId = `workorder-${workOrder.id}`;
      const existingMarker = markersRef.current.get(markerId);

      if (existingMarker) {
        // Update existing marker
        const element = existingMarker.getElement();
        const newElement = createWorkOrderMarker(workOrder, () =>
          handleMarkerClick(workOrder.id, "workorder")
        );
        element.replaceWith(newElement);
      } else {
        // Create new marker
        const element = createWorkOrderMarker(workOrder, () =>
          handleMarkerClick(workOrder.id, "workorder")
        );

        const marker = new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat(workOrder.location.coordinates)
          .addTo(map.current!);

        markersRef.current.set(markerId, marker);
      }
    });
  }, [workOrders]);

  // Update markers when sensors change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    updateSensorMarkers();
  }, [sensors, mapLoaded, updateSensorMarkers]);

  // Update incident markers when incidents change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    updateIncidentMarkers();
  }, [incidents, mapLoaded, updateIncidentMarkers]);

  // Update work order markers when work orders change
  useEffect(() => {
    if (!map.current || !mapLoaded || !showWorkOrders) return;

    updateWorkOrderMarkers();
  }, [workOrders, mapLoaded, showWorkOrders, updateWorkOrderMarkers]);

  const handleMarkerClick = (
    id: string,
    type: "sensor" | "incident" | "workorder"
  ) => {
    // Find the marker coordinates
    let coordinates: [number, number] | null = null;

    if (type === "sensor") {
      const sensor = sensors.find((s) => s.id === id);
      if (sensor) {
        coordinates = sensor.location.coordinates;
      }
    } else if (type === "incident") {
      const incident = incidents.find((i) => i.id === id);
      if (incident) {
        coordinates = incident.location.coordinates;
      }
    } else if (type === "workorder") {
      const workOrder = workOrders.find((wo) => wo.id === id);
      if (workOrder) {
        coordinates = workOrder.location.coordinates;
      }
    }

    if (coordinates) {
      setSelectedMarker({ id, type, coordinates });
    }

    if (onMarkerClick) {
      onMarkerClick(id, type);
    }
  };

  // Show popup for selected marker
  useEffect(() => {
    if (!map.current || !selectedMarker) return;

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Create popup container
    const popupContainer = document.createElement("div");

    // Create popup
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: selectedMarker.type === "incident" ? 25 : 15,
    })
      .setLngLat(selectedMarker.coordinates)
      .setDOMContent(popupContainer)
      .addTo(map.current);

    popupRef.current = popup;

    // Render React component into popup
    const root = document.createElement("div");
    popupContainer.appendChild(root);

    if (selectedMarker.type === "sensor") {
      const sensor = sensors.find((s) => s.id === selectedMarker.id);
      if (sensor) {
        const element = (
          <SensorPopup
            sensor={sensor}
            onClose={() => {
              setSelectedMarker(null);
              popup.remove();
            }}
          />
        );
        // Use createPortal to render React component
        import("react-dom/client").then(({ createRoot }) => {
          createRoot(root).render(element);
        });
      }
    } else if (selectedMarker.type === "incident") {
      const incident = incidents.find((i) => i.id === selectedMarker.id);
      if (incident) {
        const element = (
          <IncidentPopup
            incident={incident}
            onClose={() => {
              setSelectedMarker(null);
              popup.remove();
            }}
            onViewDetails={
              onIncidentViewDetails
                ? () => onIncidentViewDetails(incident.id)
                : undefined
            }
          />
        );
        import("react-dom/client").then(({ createRoot }) => {
          createRoot(root).render(element);
        });
      }
    } else if (selectedMarker.type === "workorder") {
      const workOrder = workOrders.find((wo) => wo.id === selectedMarker.id);
      if (workOrder) {
        const element = (
          <WorkOrderPopup
            workOrder={workOrder}
            onClose={() => {
              setSelectedMarker(null);
              popup.remove();
            }}
            onViewDetails={
              onWorkOrderViewDetails
                ? () => onWorkOrderViewDetails(workOrder.id)
                : undefined
            }
          />
        );
        import("react-dom/client").then(({ createRoot }) => {
          createRoot(root).render(element);
        });
      }
    }

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [
    selectedMarker,
    sensors,
    incidents,
    workOrders,
    onIncidentViewDetails,
    onWorkOrderViewDetails,
  ]);

  // Fly to location
  const flyToLocation = useCallback((location: GeoPoint, zoom = 15) => {
    if (!map.current) return;

    map.current.flyTo({
      center: location.coordinates,
      zoom,
      duration: 1500,
      essential: true,
    });
  }, []);

  // Expose flyToLocation for parent components
  useEffect(() => {
    if (map.current) {
      (map.current as any).flyToLocation = flyToLocation;
    }
  }, [flyToLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Heatmap Control */}
      {mapLoaded && MAPBOX_TOKEN && (
        <>
          <HeatmapControl
            activeType={heatmapType}
            onTypeChange={setHeatmapType}
            intensity={heatmapIntensity}
            onIntensityChange={setHeatmapIntensity}
            radius={heatmapRadius}
            onRadiusChange={setHeatmapRadius}
          />

          {/* Heatmap Layers */}
          {["temperature", "noise", "traffic", "waste"].map((type) => (
            <HeatmapLayer
              key={type}
              map={map.current}
              readings={heatmapData}
              type={type as HeatmapType}
              visible={heatmapType === type}
              intensity={heatmapIntensity}
              radius={heatmapRadius}
            />
          ))}

          {/* Zone Overlay */}
          <ZoneOverlay
            map={map.current}
            zones={zones}
            selectedZoneId={selectedZone}
            onZoneClick={onZoneClick}
          />

          {/* Map Legend */}
          {showLegend && <MapLegend showSensors showIncidents />}
        </>
      )}

      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-center text-white p-6">
            <p className="text-lg font-semibold mb-2">Map Unavailable</p>
            <p className="text-sm text-gray-300">
              Please set VITE_MAPBOX_TOKEN in your environment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
