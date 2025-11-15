import { Sensor, Incident, SensorType, Severity } from "@/types";

// Sensor type colors and icons
const SENSOR_COLORS: Record<SensorType, string> = {
  WASTE: "#f59e0b", // amber
  LIGHT: "#fbbf24", // yellow
  WATER: "#3b82f6", // blue
  TRAFFIC: "#ef4444", // red
  ENVIRONMENT: "#10b981", // green
  NOISE: "#8b5cf6", // purple
};

const SENSOR_ICONS: Record<SensorType, string> = {
  WASTE: "🗑️",
  LIGHT: "💡",
  WATER: "💧",
  TRAFFIC: "🚗",
  ENVIRONMENT: "🌿",
  NOISE: "🔊",
};

// Severity colors
const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "#10b981", // green
  MEDIUM: "#f59e0b", // amber
  HIGH: "#ef4444", // red
  CRITICAL: "#dc2626", // dark red
};

export function createSensorMarker(
  sensor: Sensor,
  onClick?: () => void
): HTMLElement {
  const el = document.createElement("div");
  el.className = "sensor-marker";
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: ${SENSOR_COLORS[sensor.type]};
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  // Add status indicator
  if (sensor.status === "warning") {
    el.style.borderColor = "#f59e0b";
    el.style.borderWidth = "3px";
  } else if (sensor.status === "offline") {
    el.style.opacity = "0.5";
  }

  el.innerHTML = SENSOR_ICONS[sensor.type];

  // Hover effect
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.2)";
    el.style.boxShadow = "0 4px 8px rgba(0,0,0,0.4)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
    el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
  });

  if (onClick) {
    el.addEventListener("click", onClick);
  }

  return el;
}

export function createIncidentMarker(
  incident: Incident,
  onClick?: () => void
): HTMLElement {
  const el = document.createElement("div");
  el.className = "incident-marker";

  const color = SEVERITY_COLORS[incident.severity];

  el.style.cssText = `
    width: 40px;
    height: 50px;
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;
  `;

  // Create pin shape
  el.innerHTML = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z"
        fill="${color}"
        stroke="white"
        stroke-width="2"
      />
      <circle cx="20" cy="20" r="8" fill="white" />
      <text
        x="20"
        y="25"
        text-anchor="middle"
        font-size="12"
        font-weight="bold"
        fill="${color}"
      >!</text>
    </svg>
  `;

  // Pulse animation for critical incidents
  if (incident.severity === "CRITICAL") {
    const pulse = document.createElement("div");
    pulse.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: ${color};
      opacity: 0.6;
      animation: pulse 2s infinite;
    `;
    el.appendChild(pulse);

    // Add keyframes
    if (!document.getElementById("pulse-animation")) {
      const style = document.createElement("style");
      style.id = "pulse-animation";
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Hover effect
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.1) translateY(-5px)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1) translateY(0)";
  });

  if (onClick) {
    el.addEventListener("click", onClick);
  }

  return el;
}

// Create cluster marker
export function createClusterMarker(count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "cluster-marker";

  el.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #3b82f6;
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: transform 0.2s;
  `;

  el.textContent = count.toString();

  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.1)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
  });

  return el;
}
