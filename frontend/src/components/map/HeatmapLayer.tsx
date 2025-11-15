import { useEffect, useRef } from "react";
import { SensorReading, SensorType } from "@/types";

export type HeatmapType = "temperature" | "noise" | "traffic" | "waste";

interface HeatmapLayerProps {
  map: any | null;
  readings: SensorReading[];
  type: HeatmapType;
  visible: boolean;
  intensity?: number;
  radius?: number;
}

const HEATMAP_CONFIGS: Record<
  HeatmapType,
  {
    sensorTypes: SensorType[];
    colorStops: [number, string][];
    weight: number;
  }
> = {
  temperature: {
    sensorTypes: ["ENVIRONMENT"],
    colorStops: [
      [0, "rgba(33, 102, 172, 0)"],
      [0.2, "rgb(103, 169, 207)"],
      [0.4, "rgb(209, 229, 240)"],
      [0.6, "rgb(253, 219, 199)"],
      [0.8, "rgb(239, 138, 98)"],
      [1, "rgb(178, 24, 43)"],
    ],
    weight: 1,
  },
  noise: {
    sensorTypes: ["NOISE"],
    colorStops: [
      [0, "rgba(0, 0, 0, 0)"],
      [0.2, "rgb(138, 92, 246)"],
      [0.4, "rgb(168, 85, 247)"],
      [0.6, "rgb(192, 132, 252)"],
      [0.8, "rgb(216, 180, 254)"],
      [1, "rgb(233, 213, 255)"],
    ],
    weight: 1,
  },
  traffic: {
    sensorTypes: ["TRAFFIC"],
    colorStops: [
      [0, "rgba(0, 0, 0, 0)"],
      [0.2, "rgb(16, 185, 129)"],
      [0.4, "rgb(245, 158, 11)"],
      [0.6, "rgb(249, 115, 22)"],
      [0.8, "rgb(239, 68, 68)"],
      [1, "rgb(220, 38, 38)"],
    ],
    weight: 1,
  },
  waste: {
    sensorTypes: ["WASTE"],
    colorStops: [
      [0, "rgba(0, 0, 0, 0)"],
      [0.2, "rgb(34, 197, 94)"],
      [0.4, "rgb(132, 204, 22)"],
      [0.6, "rgb(234, 179, 8)"],
      [0.8, "rgb(249, 115, 22)"],
      [1, "rgb(239, 68, 68)"],
    ],
    weight: 1,
  },
};

export function HeatmapLayer({
  map,
  readings,
  type,
  visible,
  intensity = 1,
  radius = 30,
}: HeatmapLayerProps) {
  const sourceId = `heatmap-source-${type}`;
  const layerId = `heatmap-layer-${type}`;
  const prevVisibleRef = useRef(visible);

  // Initialize heatmap layer
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const config = HEATMAP_CONFIGS[type];

    // Check if source exists
    if (!map.getSource(sourceId)) {
      // Add source
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add heatmap layer
      map.addLayer({
        id: layerId,
        type: "heatmap",
        source: sourceId,
        paint: {
          // Increase weight as diameter increases
          "heatmap-weight": config.weight,
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            intensity,
          ],
          // Color ramp for heatmap
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            ...config.colorStops.flat(),
          ],
          // Adjust radius by zoom level
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            radius / 2,
            15,
            radius,
          ],
          // Transition from heatmap to circle layer by zoom level
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            1,
            15,
            0.8,
          ],
        },
      });
    }

    // Set initial visibility
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");

    return () => {
      // Cleanup on unmount
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, type, sourceId, layerId]);

  // Update heatmap data when readings change
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return;

    // Filter readings by sensor type (simplified - in production, match sensor IDs to types)
    const filteredReadings = readings;

    // Transform readings to GeoJSON features
    const features = filteredReadings.map((reading) => {
      // Normalize value to 0-1 range for weight
      const normalizedValue = Math.min(reading.value / 100, 1);

      return {
        type: "Feature" as const,
        properties: {
          value: reading.value,
          weight: normalizedValue,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [0, 0], // This should come from sensor location
        },
      };
    });

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [map, readings, type, sourceId]);

  // Update visibility
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return;

    if (visible !== prevVisibleRef.current) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none"
      );
      prevVisibleRef.current = visible;
    }
  }, [map, visible, layerId]);

  // Update intensity and radius
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return;

    map.setPaintProperty(layerId, "heatmap-intensity", [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      1,
      15,
      intensity,
    ]);

    map.setPaintProperty(layerId, "heatmap-radius", [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      radius / 2,
      15,
      radius,
    ]);
  }, [map, intensity, radius, layerId]);

  return null;
}
