/**
 * Incident API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import incidentService from "../services/IncidentService";
import logger from "../utils/logger";
import { IncidentStatus, Severity } from "../types/entities";

const router = Router();

/**
 * GET /api/v1/incidents
 * Get all incidents with optional filtering and sorting
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse query parameters
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status as IncidentStatus;
    }

    if (req.query.severity) {
      filters.severity = req.query.severity as Severity;
    }

    if (req.query.zoneId) {
      filters.zoneId = req.query.zoneId as string;
    }

    if (req.query.category) {
      filters.category = req.query.category as string;
    }

    if (req.query.minPriority) {
      filters.minPriority = parseInt(req.query.minPriority as string);
    }

    if (req.query.maxPriority) {
      filters.maxPriority = parseInt(req.query.maxPriority as string);
    }

    if (req.query.startTime) {
      filters.startTime = new Date(req.query.startTime as string);
    }

    if (req.query.endTime) {
      filters.endTime = new Date(req.query.endTime as string);
    }

    // Parse sort options
    const sort = req.query.sortBy
      ? {
          field: req.query.sortBy as any,
          direction: (req.query.sortOrder?.toString().toUpperCase() ||
            "DESC") as "ASC" | "DESC",
        }
      : undefined;

    // Parse pagination
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string)
      : undefined;

    const result = await incidentService.getIncidents(
      filters,
      sort,
      limit,
      offset
    );

    res.json({
      incidents: result.incidents,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Error fetching incidents", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
});

/**
 * GET /api/v1/incidents/active
 * Get all active incidents
 */
router.get(
  "/active",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const incidents = await incidentService.getActiveIncidents();

      res.json({
        incidents,
        count: incidents.length,
      });
    } catch (error) {
      logger.error("Error fetching active incidents", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/incidents/counts
 * Get incident counts by severity
 */
router.get(
  "/counts",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const counts = await incidentService.getIncidentCountsBySeverity();

      res.json({
        counts,
        total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      });
    } catch (error) {
      logger.error("Error fetching incident counts", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/incidents/:id
 * Get specific incident details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const incident = await incidentService.getIncident(id);
    if (!incident) {
      return res.status(404).json({
        error: {
          code: "INCIDENT_NOT_FOUND",
          message: "Incident not found",
        },
      });
    }

    return res.json(incident);
  } catch (error) {
    logger.error("Error fetching incident", {
      incidentId: req.params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * POST /api/v1/incidents
 * Create a new incident manually
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentData = req.body;

    // Validate required fields
    if (
      !incidentData.type ||
      !incidentData.category ||
      !incidentData.severity ||
      !incidentData.location ||
      !incidentData.zoneId
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing required fields",
          details: {
            required: ["type", "category", "severity", "location", "zoneId"],
          },
        },
      });
    }

    // Set defaults
    incidentData.status = incidentData.status || "ACTIVE";
    incidentData.confidence = incidentData.confidence || 1.0;
    incidentData.detectedAt = incidentData.detectedAt
      ? new Date(incidentData.detectedAt)
      : new Date();
    incidentData.description =
      incidentData.description || "Manually created incident";

    const incident = await incidentService.createIncident(incidentData);

    return res.status(201).json(incident);
  } catch (error) {
    logger.error("Error creating incident", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * PATCH /api/v1/incidents/:id
 * Update an incident
 */
router.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if incident exists
      const existingIncident = await incidentService.getIncident(id);
      if (!existingIncident) {
        return res.status(404).json({
          error: {
            code: "INCIDENT_NOT_FOUND",
            message: "Incident not found",
          },
        });
      }

      const updatedIncident = await incidentService.updateIncident(id, updates);

      return res.json(updatedIncident);
    } catch (error) {
      logger.error("Error updating incident", {
        incidentId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/incidents/:id/resolve
 * Resolve an incident
 */
router.post(
  "/:id/resolve",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const incident = await incidentService.resolveIncident(id);
      if (!incident) {
        return res.status(404).json({
          error: {
            code: "INCIDENT_NOT_FOUND",
            message: "Incident not found",
          },
        });
      }

      return res.json({
        message: "Incident resolved",
        incident,
      });
    } catch (error) {
      logger.error("Error resolving incident", {
        incidentId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/incidents/:id/dismiss
 * Dismiss an incident
 */
router.post(
  "/:id/dismiss",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const incident = await incidentService.dismissIncident(id);
      if (!incident) {
        return res.status(404).json({
          error: {
            code: "INCIDENT_NOT_FOUND",
            message: "Incident not found",
          },
        });
      }

      return res.json({
        message: "Incident dismissed",
        incident,
      });
    } catch (error) {
      logger.error("Error dismissing incident", {
        incidentId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * DELETE /api/v1/incidents/:id
 * Delete an incident
 */
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deleted = await incidentService.deleteIncident(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: "INCIDENT_NOT_FOUND",
            message: "Incident not found",
          },
        });
      }

      return res.status(204).send();
    } catch (error) {
      logger.error("Error deleting incident", {
        incidentId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

export default router;
