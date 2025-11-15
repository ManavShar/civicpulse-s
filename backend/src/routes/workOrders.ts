/**
 * Work Order API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import workOrderRepository from "../repositories/WorkOrderRepository";
import workOrderSimulator from "../services/WorkOrderSimulator";
import agentLogRepository from "../repositories/AgentLogRepository";
import logger from "../utils/logger";
import { WorkOrderStatus } from "../types/entities";
import { getWebSocketService } from "../services/WebSocketService";

const router = Router();

/**
 * GET /api/v1/work-orders
 * Get all work orders with optional filtering
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse query parameters
    const filters: any = {};

    if (req.query.status) {
      // Support multiple statuses
      const statusParam = req.query.status as string;
      if (statusParam.includes(",")) {
        filters.status = statusParam.split(",") as WorkOrderStatus[];
      } else {
        filters.status = statusParam as WorkOrderStatus;
      }
    }

    if (req.query.zoneId) {
      filters.zoneId = req.query.zoneId as string;
    }

    if (req.query.assignedUnitId) {
      filters.assignedUnitId = req.query.assignedUnitId as string;
    }

    if (req.query.incidentId) {
      filters.incidentId = req.query.incidentId as string;
    }

    if (req.query.startTime) {
      filters.startTime = new Date(req.query.startTime as string);
    }

    if (req.query.endTime) {
      filters.endTime = new Date(req.query.endTime as string);
    }

    const workOrders = await workOrderRepository.findWithFilters(filters);

    res.json({
      workOrders,
      count: workOrders.length,
    });
  } catch (error) {
    logger.error("Error fetching work orders", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
});

/**
 * GET /api/v1/work-orders/active
 * Get all active work orders (not completed or cancelled)
 */
router.get(
  "/active",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workOrders = await workOrderRepository.findActive();

      res.json({
        workOrders,
        count: workOrders.length,
      });
    } catch (error) {
      logger.error("Error fetching active work orders", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/work-orders/counts
 * Get work order counts by status
 */
router.get(
  "/counts",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const counts = await workOrderRepository.getCountsByStatus();

      res.json({
        counts,
        total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      });
    } catch (error) {
      logger.error("Error fetching work order counts", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/work-orders/units
 * Get available field units
 */
router.get(
  "/units",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const allUnits = workOrderSimulator.getFieldUnits();
      const availableUnits = workOrderSimulator.getAvailableUnits();

      res.json({
        units: allUnits,
        availableCount: availableUnits.length,
        totalCount: allUnits.length,
      });
    } catch (error) {
      logger.error("Error fetching field units", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/work-orders/:id
 * Get specific work order details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const workOrder = await workOrderRepository.findById(id);
    if (!workOrder) {
      return res.status(404).json({
        error: {
          code: "WORKORDER_NOT_FOUND",
          message: "Work order not found",
        },
      });
    }

    // Get explanation from agent logs if available
    let explanation = null;
    if (workOrder.id) {
      const logs = await agentLogRepository.findByWorkOrder(workOrder.id);
      const analystLog = logs.find((log) => log.agentType === "ANALYST");
      if (analystLog && analystLog.data.explanation) {
        explanation = analystLog.data.explanation;
      }
    }

    return res.json({
      ...workOrder,
      explanation,
    });
  } catch (error) {
    logger.error("Error fetching work order", {
      workOrderId: req.params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * POST /api/v1/work-orders
 * Create a new work order
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workOrderData = req.body;

    // Validate required fields
    if (
      !workOrderData.title ||
      !workOrderData.description ||
      !workOrderData.location ||
      !workOrderData.zoneId
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing required fields",
          details: {
            required: ["title", "description", "location", "zoneId"],
          },
        },
      });
    }

    // Set defaults
    workOrderData.status = workOrderData.status || "CREATED";
    workOrderData.priority = workOrderData.priority || "MEDIUM";
    workOrderData.estimatedDuration = workOrderData.estimatedDuration || 30;

    // Calculate estimated completion if not provided
    if (!workOrderData.estimatedCompletion && workOrderData.estimatedDuration) {
      const now = new Date();
      workOrderData.estimatedCompletion = new Date(
        now.getTime() + workOrderData.estimatedDuration * 60 * 1000
      );
    }

    const workOrder = await workOrderRepository.create(workOrderData);

    // Broadcast creation
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcast("workorder:created", workOrder);
    }

    // Start simulation if auto-start is enabled (default true)
    const autoStart = req.body.autoStart !== false;
    if (autoStart) {
      workOrderSimulator.startSimulation(workOrder.id);
      logger.info("Work order simulation started", {
        workOrderId: workOrder.id,
      });
    }

    return res.status(201).json(workOrder);
  } catch (error) {
    logger.error("Error creating work order", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * PATCH /api/v1/work-orders/:id/status
 * Update work order status
 */
router.patch(
  "/:id/status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Status is required",
          },
        });
      }

      // Validate status value
      const validStatuses: WorkOrderStatus[] = [
        "CREATED",
        "ASSIGNED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid status value",
            details: {
              validStatuses,
            },
          },
        });
      }

      // Check if work order exists
      const existingWorkOrder = await workOrderRepository.findById(id);
      if (!existingWorkOrder) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      // Update status (repository validates state machine)
      try {
        const updatedWorkOrder = await workOrderRepository.updateStatus(
          id,
          status
        );

        // Broadcast update
        const wsService = getWebSocketService();
        if (wsService && updatedWorkOrder) {
          wsService.broadcast("workorder:updated", updatedWorkOrder);
        }

        return res.json(updatedWorkOrder);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Invalid status transition")
        ) {
          return res.status(400).json({
            error: {
              code: "INVALID_TRANSITION",
              message: error.message,
            },
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error("Error updating work order status", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * PATCH /api/v1/work-orders/:id
 * Update work order details
 */
router.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if work order exists
      const existingWorkOrder = await workOrderRepository.findById(id);
      if (!existingWorkOrder) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      // Don't allow status updates through this endpoint
      if (updates.status) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Use PATCH /api/v1/work-orders/:id/status to update status",
          },
        });
      }

      const updatedWorkOrder = await workOrderRepository.update(id, updates);

      // Broadcast update
      const wsService = getWebSocketService();
      if (wsService && updatedWorkOrder) {
        wsService.broadcast("workorder:updated", updatedWorkOrder);
      }

      return res.json(updatedWorkOrder);
    } catch (error) {
      logger.error("Error updating work order", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/work-orders/:id/assign
 * Assign work order to a unit
 */
router.post(
  "/:id/assign",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { unitId } = req.body;

      if (!unitId) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Unit ID is required",
          },
        });
      }

      // Check if work order exists
      const existingWorkOrder = await workOrderRepository.findById(id);
      if (!existingWorkOrder) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      const updatedWorkOrder = await workOrderRepository.assignToUnit(
        id,
        unitId
      );

      // Broadcast update
      const wsService = getWebSocketService();
      if (wsService && updatedWorkOrder) {
        wsService.broadcast("workorder:updated", updatedWorkOrder);
      }

      return res.json(updatedWorkOrder);
    } catch (error) {
      logger.error("Error assigning work order", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/work-orders/:id/simulate
 * Start work order simulation
 */
router.post(
  "/:id/simulate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if work order exists
      const workOrder = await workOrderRepository.findById(id);
      if (!workOrder) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      // Start simulation
      workOrderSimulator.startSimulation(id);

      return res.json({
        message: "Work order simulation started",
        workOrderId: id,
      });
    } catch (error) {
      logger.error("Error starting work order simulation", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * POST /api/v1/work-orders/:id/cancel
 * Cancel work order simulation
 */
router.post(
  "/:id/cancel",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if work order exists
      const workOrder = await workOrderRepository.findById(id);
      if (!workOrder) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      // Cancel simulation
      await workOrderSimulator.cancelSimulation(id);

      return res.json({
        message: "Work order cancelled",
        workOrderId: id,
      });
    } catch (error) {
      logger.error("Error cancelling work order", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

/**
 * DELETE /api/v1/work-orders/:id
 * Delete a work order
 */
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deleted = await workOrderRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: "WORKORDER_NOT_FOUND",
            message: "Work order not found",
          },
        });
      }

      return res.status(204).send();
    } catch (error) {
      logger.error("Error deleting work order", {
        workOrderId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

export default router;
