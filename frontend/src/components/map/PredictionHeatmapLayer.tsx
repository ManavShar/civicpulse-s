import { useEffect } from "react";
import { Map as MapboxMap } from "mapbox-gl";
import { Prediction, Sensor } from "@/types";

interface PredictionHeatmapLayerProps {
  map: MapboxMap | null;
  predictions: Prediction[];
  sensors: Sensor[];
  visible: boolean;
}

export function PredictionHeatmapLayer({
  map,
  predictions,
  sensors,
  visible,
}: PredictionHeatmapLayerProps) {
  useEffect(() => {
    if (!map || !visible) {
      // Remove layer if not visible
      if (map && map.getLayer("prediction-heatmap")) {
        map.removeLayer("prediction-heatmap");
      }
      if (map && map.getSource("prediction-heatmap")) {
        map.removeSource("prediction-heatmap");
      }
      return;
    }

    // Create GeoJSON data from predictions
    const features = predictions
      .filter((pred) => pred.confidence >= 0.6) // Only show confident predictions
      .map((pred) => {
        const sensor = sensors.find((s) => s.id === pred.sensorId);
        if (!sensor) return null;

        // Calculate risk score (0-1) based on predicted value and confidence
        const normalizedValue = Math.min(pred.predictedValue / 100, 1);
        const riskScore = normalizedValue * pred.confidence;

        return {
          type: "Feature" as const,
          properties: {
            risk: riskScore,
            value: pred.predictedValue,
            confidence: pred.confidence,
          },
          geometry: {
            type: "Point" as const,
            coordinates: sensor.location.coordinates,
          },
        };
      })
      .filter((f) => f !== null);

    const geojson = {
      type: "FeatureCollection" as const,
      features,
    };

    // Add or update source
    if (map.getSource("prediction-heatmap")) {
      (map.getSource("prediction-heatmap") as any).setData(geojson);
    } else {
      map.addSource("prediction-heatmap", {
        type: "geojson",
        data: geojson as any,
      });
    }

    // Add or update layer
    if (!map.getLayer("prediction-heatmap")) {
      map.addLayer(
        {
          id: "prediction-heatmap",
          type: "heatmap",
          source: "prediction-heatmap",
          paint: {
            // Increase weight based on risk score
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "risk"],
              0,
              0,
              1,
              1,
            ],
            // Increase intensity as zoom level increases
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              15,
              3,
            ],
            // Color ramp for heatmap (yellow to red for predictions/warnings)
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 255, 0)",
              0.2,
              "rgba(255, 255, 0, 0.3)",
              0.4,
              "rgba(255, 200, 0, 0.5)",
              0.6,
              "rgba(255, 150, 0, 0.7)",
              0.8,
              "rgba(255, 100, 0, 0.8)",
              1,
              "rgba(255, 0, 0, 0.9)",
            ],
            // Adjust radius based on zoom level
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              10,
              15,
              40,
            ],
            // Transition from heatmap to circle layer at higher zoom
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              0.8,
              15,
              0.4,
            ],
          },
        },
        "waterway-label" // Add below labels
      );
    }

    return () => {
      // Cleanup on unmount
      if (map.getLayer("prediction-heatmap")) {
        map.removeLayer("prediction-heatmap");
      }
      if (map.getSource("prediction-heatmap")) {
        map.removeSource("prediction-heatmap");
      }
    };
  }, [map, predictions, sensors, visible]);

  return null;
}
