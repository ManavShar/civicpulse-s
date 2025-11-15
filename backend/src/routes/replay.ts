import { Router, Request, Response } from "express";
import { ReplayService, TimelineEventType } from "../services/ReplayService";
import { cacheService } from "../services/CacheService";
import db from "../db/connection";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/replay/timeline
 * Get timeline events for replay
 *
 * Query parameters:
 * - startTime: ISO 8601 timestamp (required)
 * - endTime: ISO 8601 timestamp (required)
 * - eventTypes: Comma-separated list of event types (optional: SENSOR,INCIDENT,WORKORDER,AGENT)
 * - limit: Maximum number of events to return (optional, default: 1000)
 * - offset: Number of events to skip (optional, default: 0)
 */
router.get("/timeline", async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, eventTypes, limit, offset } = req.query;

    // Validate required parameters
    if (!startTime || !endTime) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "startTime and endTime are required",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Parse dates
    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid date format for startTime or endTime",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "startTime must be before endTime",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Parse event types
    let parsedEventTypes: TimelineEventType[] | undefined;
    if (eventTypes) {
      const types = (eventTypes as string)
        .split(",")
        .map((t) => t.trim().toUpperCase());
      const validTypes: TimelineEventType[] = [
        "SENSOR",
        "INCIDENT",
        "WORKORDER",
        "AGENT",
      ];

      parsedEventTypes = types.filter((t) =>
        validTypes.includes(t as TimelineEventType)
      ) as TimelineEventType[];

      if (parsedEventTypes.length === 0) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Invalid eventTypes. Must be one or more of: SENSOR, INCIDENT, WORKORDER, AGENT",
            timestamp: new Date(),
            requestId: req.id,
          },
        });
      }
    }

    // Parse pagination parameters
    const parsedLimit = limit
      ? Math.min(parseInt(limit as string, 10), 10000)
      : 1000;
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

    if (
      isNaN(parsedLimit) ||
      isNaN(parsedOffset) ||
      parsedLimit < 1 ||
      parsedOffset < 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid limit or offset",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Get replay service
    const replayService = new ReplayService(db.getPool(), cacheService);

    // Fetch timeline events
    const events = await replayService.getTimeline({
      startTime: start,
      endTime: end,
      eventTypes: parsedEventTypes,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    logger.info("Timeline events retrieved", {
      requestId: req.id,
      startTime: start,
      endTime: end,
      eventTypes: parsedEventTypes,
      count: events.length,
    });

    return res.json({
      events,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        count: events.length,
      },
      query: {
        startTime: start,
        endTime: end,
        eventTypes: parsedEventTypes,
      },
    });
  } catch (error) {
    logger.error("Error fetching timeline events", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: req.id,
    });

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch timeline events",
        timestamp: new Date(),
        requestId: req.id,
      },
    });
  }
});

/**
 * GET /api/v1/replay/snapshot/:timestamp
 * Get system snapshot at specific timestamp
 *
 * Path parameters:
 * - timestamp: ISO 8601 timestamp or Unix timestamp in milliseconds
 */
router.get("/snapshot/:timestamp", async (req: Request, res: Response) => {
  try {
    const { timestamp } = req.params;

    // Parse timestamp
    let parsedTimestamp: Date;

    // Try parsing as ISO 8601 first
    parsedTimestamp = new Date(timestamp);

    // If invalid, try parsing as Unix timestamp
    if (isNaN(parsedTimestamp.getTime())) {
      const unixTimestamp = parseInt(timestamp, 10);
      if (!isNaN(unixTimestamp)) {
        parsedTimestamp = new Date(unixTimestamp);
      }
    }

    if (isNaN(parsedTimestamp.getTime())) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid timestamp format",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Get replay service
    const replayService = new ReplayService(db.getPool(), cacheService);

    // Fetch snapshot
    const snapshot = await replayService.getSnapshot(parsedTimestamp);

    logger.info("System snapshot retrieved", {
      requestId: req.id,
      timestamp: parsedTimestamp,
      sensorsCount: snapshot.sensors.length,
      incidentsCount: snapshot.incidents.length,
      workOrdersCount: snapshot.workOrders.length,
    });

    return res.json(snapshot);
  } catch (error) {
    logger.error("Error fetching system snapshot", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: req.id,
    });

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch system snapshot",
        timestamp: new Date(),
        requestId: req.id,
      },
    });
  }
});

/**
 * GET /api/v1/replay/stream
 * Stream timeline events for continuous replay
 *
 * Query parameters:
 * - startTime: ISO 8601 timestamp (required)
 * - endTime: ISO 8601 timestamp (required)
 * - playbackSpeed: Playback speed multiplier (optional, default: 1.0, range: 0.5-10.0)
 * - eventTypes: Comma-separated list of event types (optional)
 */
router.get("/stream", async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, playbackSpeed, eventTypes } = req.query;

    // Validate required parameters
    if (!startTime || !endTime) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "startTime and endTime are required",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Parse dates
    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid date format for startTime or endTime",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Parse playback speed
    const speed = playbackSpeed ? parseFloat(playbackSpeed as string) : 1.0;
    if (isNaN(speed) || speed < 0.5 || speed > 10.0) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid playbackSpeed. Must be between 0.5 and 10.0",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }

    // Parse event types
    let parsedEventTypes: TimelineEventType[] | undefined;
    if (eventTypes) {
      const types = (eventTypes as string)
        .split(",")
        .map((t) => t.trim().toUpperCase());
      const validTypes: TimelineEventType[] = [
        "SENSOR",
        "INCIDENT",
        "WORKORDER",
        "AGENT",
      ];

      parsedEventTypes = types.filter((t) =>
        validTypes.includes(t as TimelineEventType)
      ) as TimelineEventType[];
    }

    // Set up Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Get replay service
    const replayService = new ReplayService(db.getPool(), cacheService);

    // Fetch all events
    const events = await replayService.getTimeline({
      startTime: start,
      endTime: end,
      eventTypes: parsedEventTypes,
      limit: 10000,
    });

    logger.info("Starting event stream", {
      requestId: req.id,
      startTime: start,
      endTime: end,
      playbackSpeed: speed,
      eventCount: events.length,
    });

    // Stream events with timing
    let eventIndex = 0;
    const streamStartTime = Date.now();
    const timelineStartTime = start.getTime();

    const streamInterval = setInterval(() => {
      if (eventIndex >= events.length) {
        // Send completion event
        res.write(
          `event: complete\ndata: ${JSON.stringify({
            message: "Replay complete",
          })}\n\n`
        );
        clearInterval(streamInterval);
        res.end();
        return;
      }

      const currentEvent = events[eventIndex];
      const eventTime = currentEvent.timestamp.getTime();
      const elapsedRealTime = Date.now() - streamStartTime;
      const elapsedTimelineTime = (eventTime - timelineStartTime) / speed;

      // Send event if it's time
      if (elapsedRealTime >= elapsedTimelineTime) {
        res.write(`event: timeline\ndata: ${JSON.stringify(currentEvent)}\n\n`);
        eventIndex++;
      }
    }, 100); // Check every 100ms

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(streamInterval);
      logger.info("Client disconnected from event stream", {
        requestId: req.id,
      });
    });

    // Return to satisfy TypeScript - the response is handled by the stream
    return;
  } catch (error) {
    logger.error("Error streaming timeline events", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: req.id,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to stream timeline events",
          timestamp: new Date(),
          requestId: req.id,
        },
      });
    }
    // If headers already sent, just return (stream is already in progress)
    return;
  }
});

export default router;
