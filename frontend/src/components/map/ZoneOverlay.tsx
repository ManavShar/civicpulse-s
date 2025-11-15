import { useEffect, useRef } from "react";
import { Zone } from "@/types";

interface ZoneOverlayProps {
  map: any | null;
  zones: Zone[];
  selectedZoneId?: string | null;
  onZoneClick?: (zoneId: string) => void;
}

export function ZoneOverlay({
  map,
  zones,
  selectedZoneId,
  onZoneClick,
}: ZoneOverlayProps) {
  const sourceId = "zones-source";
  const fillLayerId = "zones-fill";
  const lineLayerId = "zones-line";
  const hoveredZoneIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add fill layer
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#3b82f6",
            ["boolean", ["feature-state", "selected"], false],
            "#2563eb",
            "#6b7280",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            ["boolean", ["feature-state", "selected"], false],
            0.4,
            0.1,
          ],
        },
      });

      // Add line layer
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#2563eb",
            "#9ca3af",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            2,
          ],
          "line-opacity": 0.8,
        },
      });

      // Add hover effect
      map.on("mousemove", fillLayerId, (e: any) => {
        if (e.features && e.features.length > 0) {
          if (hoveredZoneIdRef.current) {
            map.setFeatureState(
              { source: sourceId, id: hoveredZoneIdRef.current },
              { hover: false }
            );
          }

          const zoneId = e.features[0].id as string;
          hoveredZoneIdRef.current = zoneId;

          map.setFeatureState(
            { source: sourceId, id: zoneId },
            { hover: true }
          );

          map.getCanvas().style.cursor = "pointer";
        }
      });

      map.on("mouseleave", fillLayerId, () => {
        if (hoveredZoneIdRef.current) {
          map.setFeatureState(
            { source: sourceId, id: hoveredZoneIdRef.current },
            { hover: false }
          );
        }
        hoveredZoneIdRef.current = null;
        map.getCanvas().style.cursor = "";
      });

      // Add click handler
      map.on("click", fillLayerId, (e: any) => {
        if (e.features && e.features.length > 0 && onZoneClick) {
          const zoneId = e.features[0].id as string;
          onZoneClick(zoneId);
        }
      });
    }

    return () => {
      if (map.getLayer(fillLayerId)) {
        map.removeLayer(fillLayerId);
      }
      if (map.getLayer(lineLayerId)) {
        map.removeLayer(lineLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, onZoneClick]);

  // Update zone data
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return;

    const features = zones.map((zone) => ({
      type: "Feature" as const,
      id: zone.id,
      properties: {
        name: zone.name,
        type: zone.type,
        population: zone.population,
      },
      geometry: zone.boundary,
    }));

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [map, zones]);

  // Update selected zone
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return;

    // Clear all selected states
    zones.forEach((zone) => {
      map.setFeatureState(
        { source: sourceId, id: zone.id },
        { selected: false }
      );
    });

    // Set selected state for the selected zone
    if (selectedZoneId) {
      map.setFeatureState(
        { source: sourceId, id: selectedZoneId },
        { selected: true }
      );
    }
  }, [map, zones, selectedZoneId]);

  return null;
}
