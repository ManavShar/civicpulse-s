import { useEffect, useCallback, useRef } from "react";
import { useReplayStore } from "../stores/replayStore";
import { useSensorStore } from "../stores/sensorStore";
import { useIncidentStore } from "../stores/incidentStore";
import { useWorkOrderStore } from "../stores/workOrderStore";
import { useAgentStore } from "../stores/agentStore";
import { apiClient } from "../lib/api";
import { TimelineEvent, SystemSnapshot } from "../types";

interface UseReplayDataOptions {
  autoFetch?: boolean;
  cacheTimeout?: number; // milliseconds
}

export function useReplayData(options: UseReplayDataOptions = {}) {
  const { autoFetch = true, cacheTimeout = 60000 } = options;

  const {
    isReplayMode,
    startTime,
    endTime,
    currentTime,
    events,
    setEvents,
    setCurrentSnapshot,
    setLoadingTimeline,
    setLoadingSnapshot,
  } = useReplayStore();

  const { setSensors } = useSensorStore();
  const { setIncidents } = useIncidentStore();
  const { setWorkOrders } = useWorkOrderStore();
  const { setMessages } = useAgentStore();

  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch timeline data
  const fetchTimeline = useCallback(
    async (start: Date, end: Date) => {
      const cacheKey = `timeline-${start.getTime()}-${end.getTime()}`;
      const cached = cacheRef.current.get(cacheKey);

      // Check cache
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        setEvents(cached.data);
        return cached.data;
      }

      setLoadingTimeline(true);

      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const response = await apiClient.replay.getTimeline({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          signal: abortControllerRef.current.signal,
        });

        // Safety check: ensure response.data is an array
        const dataArray = Array.isArray(response.data) ? response.data : [];
        const timelineEvents: TimelineEvent[] = dataArray.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));

        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: timelineEvents,
          timestamp: Date.now(),
        });

        setEvents(timelineEvents);
        return timelineEvents;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch timeline:", error);
        }
        return [];
      } finally {
        setLoadingTimeline(false);
      }
    },
    [setEvents, setLoadingTimeline, cacheTimeout]
  );

  // Fetch snapshot at specific time
  const fetchSnapshot = useCallback(
    async (timestamp: Date) => {
      const cacheKey = `snapshot-${timestamp.getTime()}`;
      const cached = cacheRef.current.get(cacheKey);

      // Check cache
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        setCurrentSnapshot(cached.data);
        return cached.data;
      }

      setLoadingSnapshot(true);

      try {
        const response = await apiClient.replay.getSnapshot(
          timestamp.toISOString()
        );

        const snapshot: SystemSnapshot = {
          ...response.data,
          timestamp: new Date(response.data.timestamp),
          sensors: response.data.sensors.map((s: any) => ({
            ...s,
            lastReading: s.lastReading
              ? {
                  ...s.lastReading,
                  timestamp: new Date(s.lastReading.timestamp),
                }
              : undefined,
          })),
          incidents: response.data.incidents.map((i: any) => ({
            ...i,
            detectedAt: new Date(i.detectedAt),
            resolvedAt: i.resolvedAt ? new Date(i.resolvedAt) : undefined,
          })),
          workOrders: response.data.workOrders.map((w: any) => ({
            ...w,
            estimatedCompletion: w.estimatedCompletion
              ? new Date(w.estimatedCompletion)
              : undefined,
            startedAt: w.startedAt ? new Date(w.startedAt) : undefined,
            completedAt: w.completedAt ? new Date(w.completedAt) : undefined,
          })),
        };

        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: snapshot,
          timestamp: Date.now(),
        });

        setCurrentSnapshot(snapshot);
        return snapshot;
      } catch (error) {
        console.error("Failed to fetch snapshot:", error);
        return null;
      } finally {
        setLoadingSnapshot(false);
      }
    },
    [setCurrentSnapshot, setLoadingSnapshot, cacheTimeout]
  );

  // Synchronize stores with snapshot data
  const synchronizeStores = useCallback(
    (snapshot: SystemSnapshot) => {
      setSensors(snapshot.sensors);
      setIncidents(snapshot.incidents);
      setWorkOrders(snapshot.workOrders);

      // Extract agent messages from events
      const agentEvents = events.filter((e) => e.type === "AGENT");
      const agentMessages = agentEvents.map((e) => e.data);
      setMessages(agentMessages);

      return snapshot;
    },
    [events, setSensors, setIncidents, setWorkOrders, setMessages]
  );

  // Auto-fetch timeline when time range changes
  useEffect(() => {
    if (autoFetch && isReplayMode && startTime && endTime) {
      fetchTimeline(startTime, endTime);
    }
  }, [autoFetch, isReplayMode, startTime, endTime, fetchTimeline]);

  // Auto-fetch snapshot when current time changes
  useEffect(() => {
    if (isReplayMode && currentTime) {
      const debounceTimer = setTimeout(() => {
        fetchSnapshot(currentTime).then((snapshot) => {
          if (snapshot) {
            synchronizeStores(snapshot);
          }
        });
      }, 100); // Debounce to avoid too many requests

      return () => clearTimeout(debounceTimer);
    }

    return undefined;
  }, [isReplayMode, currentTime, fetchSnapshot, synchronizeStores]);

  // Clear cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      cacheRef.current.forEach((value, key) => {
        if (now - value.timestamp > cacheTimeout) {
          cacheRef.current.delete(key);
        }
      });
    }, cacheTimeout);

    return () => clearInterval(interval);
  }, [cacheTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    fetchTimeline,
    fetchSnapshot,
    synchronizeStores,
  };
}
