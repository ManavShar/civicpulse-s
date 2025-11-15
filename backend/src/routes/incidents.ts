/**
 * Incident API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import incidentService from "../services/IncidentService";
import logger from "../utils/logger";
import { IncidentStatus, Severity } from "../types/entities";

const router = Router();

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: Get all incidents
 *     description: Retrieve a list of incidents with optional filtering, sorting, and pagination
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RESOLVED, DISMISSED]
 *         description: Filter by incident status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity level
 *       - in: query
 *         name: zoneId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by zone ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by incident category
 *       - in: query
 *         name: minPriority
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum priority score
 *       - in: query
 *         name: maxPriority
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum priority score
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents detected after this time
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents detected before this time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [detectedAt, priorityScore, severity]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of incidents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *                 total:
 *                   type: integer
 *                   description: Total number of incidents matching filters
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/active:
 *   get:
 *     summary: Get all active incidents
 *     description: Retrieve only incidents with ACTIVE status
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active incidents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/counts:
 *   get:
 *     summary: Get incident counts by severity
 *     description: Retrieve aggregated counts of incidents grouped by severity level
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incident counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 counts:
 *                   type: object
 *                   properties:
 *                     LOW:
 *                       type: integer
 *                     MEDIUM:
 *                       type: integer
 *                     HIGH:
 *                       type: integer
 *                     CRITICAL:
 *                       type: integer
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get specific incident details
 *     description: Retrieve detailed information about a specific incident by ID
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Create a new incident manually
 *     description: Manually create an incident (typically used for testing or manual reporting)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - category
 *               - severity
 *               - location
 *               - zoneId
 *             properties:
 *               type:
 *                 type: string
 *                 example: WASTE_OVERFLOW
 *               category:
 *                 type: string
 *                 enum: [WASTE_OVERFLOW, LIGHTING_FAILURE, WATER_ANOMALY, TRAFFIC_CONGESTION, ENVIRONMENTAL_HAZARD, NOISE_COMPLAINT]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               location:
 *                 $ref: '#/components/schemas/GeoPoint'
 *               zoneId:
 *                 type: string
 *                 format: uuid
 *               sensorId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *                 example: Manual incident report
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 1.0
 *               priorityScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *           example:
 *             type: WASTE_OVERFLOW
 *             category: WASTE_OVERFLOW
 *             severity: HIGH
 *             location:
 *               type: Point
 *               coordinates: [-122.4194, 37.7749]
 *             zoneId: 550e8400-e29b-41d4-a716-446655440000
 *             description: Waste bin overflow reported by citizen
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/{id}:
 *   patch:
 *     summary: Update an incident
 *     description: Update specific fields of an existing incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, RESOLVED, DISMISSED]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description:
 *                 type: string
 *               priorityScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *           example:
 *             status: RESOLVED
 *             description: Issue has been addressed
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/{id}/resolve:
 *   post:
 *     summary: Resolve an incident
 *     description: Mark an incident as resolved and set the resolved timestamp
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Incident resolved
 *                 incident:
 *                   $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/{id}/dismiss:
 *   post:
 *     summary: Dismiss an incident
 *     description: Mark an incident as dismissed (false positive or not requiring action)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident dismissed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Incident dismissed
 *                 incident:
 *                   $ref: '#/components/schemas/Incident'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     description: Permanently delete an incident from the system
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       204:
 *         description: Incident deleted successfully (no content)
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
