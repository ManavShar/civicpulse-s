import { useEffect, useState } from "react";
import { useScenarioStore } from "../stores/scenarioStore";

interface MapStyleOverride {
  filter?: string;
  backgroundColor?: string;
}

const SCENARIO_MAP_STYLES: Record<string, MapStyleOverride> = {
  flood: {
    filter: "hue-rotate(200deg) saturate(1.2)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  fire: {
    filter: "hue-rotate(350deg) saturate(1.3) brightness(1.1)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  "traffic-congestion": {
    filter: "hue-rotate(30deg) saturate(1.1)",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  "heat-wave": {
    filter: "hue-rotate(20deg) saturate(1.4) brightness(1.15)",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  "power-outage": {
    filter: "grayscale(0.3) brightness(0.8)",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
};

export function useScenarioMapStyle() {
  const { activeScenario } = useScenarioStore();
  const [mapStyle, setMapStyle] = useState<MapStyleOverride>({});

  useEffect(() => {
    if (activeScenario) {
      const style = SCENARIO_MAP_STYLES[activeScenario.id] || {};
      setMapStyle(style);
    } else {
      setMapStyle({});
    }
  }, [activeScenario]);

  return mapStyle;
}
