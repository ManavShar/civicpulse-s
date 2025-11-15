import { useCallback, useRef, useEffect } from "react";

/**
 * Debounce hook for map events
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttle hook for high-frequency events
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      if (!inThrottle.current) {
        callbackRef.current(...args);
        inThrottle.current = true;

        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [limit]
  );
}

/**
 * Request animation frame hook for smooth updates
 */
export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  enabled: boolean = true
) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled]);
}

/**
 * Batch updates to reduce re-renders
 */
export class BatchUpdater<T> {
  private queue: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private callback: (items: T[]) => void;
  private delay: number;

  constructor(callback: (items: T[]) => void, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
  }

  add(item: T) {
    this.queue.push(item);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.queue.length > 0) {
      this.callback([...this.queue]);
      this.queue = [];
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  clear() {
    this.queue = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

/**
 * Marker virtualization - only render markers in viewport
 */
export function getMarkersInViewport<
  T extends { coordinates: [number, number] }
>(
  markers: T[],
  bounds: { north: number; south: number; east: number; west: number },
  padding: number = 0.1 // 10% padding
): T[] {
  const latPadding = (bounds.north - bounds.south) * padding;
  const lngPadding = (bounds.east - bounds.west) * padding;

  return markers.filter((marker) => {
    const [lng, lat] = marker.coordinates;
    return (
      lat >= bounds.south - latPadding &&
      lat <= bounds.north + latPadding &&
      lng >= bounds.west - lngPadding &&
      lng <= bounds.east + lngPadding
    );
  });
}

/**
 * Calculate if markers have changed (for efficient updates)
 */
export function markersChanged<T extends { id: string }>(
  prev: T[],
  next: T[]
): boolean {
  if (prev.length !== next.length) return true;

  const prevIds = new Set(prev.map((m) => m.id));
  const nextIds = new Set(next.map((m) => m.id));

  // Check if IDs are different
  for (const id of nextIds) {
    if (!prevIds.has(id)) return true;
  }

  return false;
}

/**
 * Get changed markers for efficient updates
 */
export function getChangedMarkers<T extends { id: string }>(
  prev: T[],
  next: T[]
): {
  added: T[];
  removed: T[];
  updated: T[];
} {
  // Safety checks: ensure both are arrays
  const prevArray = Array.isArray(prev) ? prev : [];
  const nextArray = Array.isArray(next) ? next : [];

  const prevMap = new Map(prevArray.map((m) => [m.id, m]));
  const nextMap = new Map(nextArray.map((m) => [m.id, m]));

  const added: T[] = [];
  const removed: T[] = [];
  const updated: T[] = [];

  // Find added and updated
  for (const [id, marker] of nextMap) {
    if (!prevMap.has(id)) {
      added.push(marker);
    } else {
      // Check if marker data changed (simplified check)
      const prevMarker = prevMap.get(id)!;
      if (JSON.stringify(prevMarker) !== JSON.stringify(marker)) {
        updated.push(marker);
      }
    }
  }

  // Find removed
  for (const [id, marker] of prevMap) {
    if (!nextMap.has(id)) {
      removed.push(marker);
    }
  }

  return { added, removed, updated };
}

/**
 * Progressive loading helper
 */
export class ProgressiveLoader<T> {
  private items: T[];
  private batchSize: number;
  private currentIndex: number = 0;
  private callback: (batch: T[], isComplete: boolean) => void;

  constructor(
    items: T[],
    batchSize: number,
    callback: (batch: T[], isComplete: boolean) => void
  ) {
    this.items = items;
    this.batchSize = batchSize;
    this.callback = callback;
  }

  loadNext(): boolean {
    if (this.currentIndex >= this.items.length) {
      return false;
    }

    const batch = this.items.slice(
      this.currentIndex,
      this.currentIndex + this.batchSize
    );
    this.currentIndex += this.batchSize;

    const isComplete = this.currentIndex >= this.items.length;
    this.callback(batch, isComplete);

    return !isComplete;
  }

  loadAll() {
    while (this.loadNext()) {
      // Continue loading
    }
  }

  reset() {
    this.currentIndex = 0;
  }

  get progress(): number {
    return Math.min(this.currentIndex / this.items.length, 1);
  }
}
