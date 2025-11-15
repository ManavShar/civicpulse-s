import { create } from "zustand";
import { Sensor, SensorReading } from "@/types";

interface SensorState {
  sensors: Sensor[];
  selectedSensorId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSensors: (sensors: Sensor[]) => void;
  addSensor: (sensor: Sensor) => void;
  updateSensor: (id: string, updates: Partial<Sensor>) => void;
  removeSensor: (id: string) => void;
  setSelectedSensor: (id: string | null) => void;
  updateSensorReading: (reading: SensorReading) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getSensorById: (id: string) => Sensor | undefined;
  getSensorsByType: (type: string) => Sensor[];
  getSensorsByZone: (zoneId: string) => Sensor[];
}

export const useSensorStore = create<SensorState>((set, get) => ({
  sensors: [],
  selectedSensorId: null,
  loading: false,
  error: null,

  setSensors: (sensors) => set({ sensors, error: null }),

  addSensor: (sensor) =>
    set((state) => ({
      sensors: [...state.sensors, sensor],
    })),

  updateSensor: (id, updates) =>
    set((state) => ({
      sensors: state.sensors.map((sensor) =>
        sensor.id === id ? { ...sensor, ...updates } : sensor
      ),
    })),

  removeSensor: (id) =>
    set((state) => ({
      sensors: state.sensors.filter((sensor) => sensor.id !== id),
    })),

  setSelectedSensor: (id) => set({ selectedSensorId: id }),

  updateSensorReading: (reading) =>
    set((state) => ({
      sensors: state.sensors.map((sensor) =>
        sensor.id === reading.sensorId
          ? {
              ...sensor,
              currentValue: reading.value,
              lastReading: reading,
            }
          : sensor
      ),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Selectors
  getSensorById: (id) => get().sensors.find((s) => s.id === id),

  getSensorsByType: (type) => get().sensors.filter((s) => s.type === type),

  getSensorsByZone: (zoneId) =>
    get().sensors.filter((s) => s.zoneId === zoneId),
}));
