/**
 * Scenario API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import scenarioService from "../services/ScenarioService";
import logger from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/scenarios
 * Get all available scenarios
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = scenarioService.getAvailableScenarios();

    res.json({
      scenarios,
      count: scenarios.length,
    });
  } catch (error) {
    logger.error("Error fetching scenarios", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
});

/**
 * GET /api/v1/scenarios/:id
 * Get specific scenario details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const scenario = scenarioService.getScenarioById(id);
    if (!scenario) {
      return res.status(404).json({
        error: {
          code: "SCENARIO_NOT_FOUND",
          message: `Scenario "${id}" not found`,
        },
      });
    }

    return res.json(scenario);
  } catch (error) {
    logger.error("Error fetching scenario", {
      scenarioId: req.params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return next(error);
  }
});

/**
 * GET /api/v1/scenarios/status
 * Get current scenario status
 */
router.get(
  "/status/current",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = scenarioService.getScenarioStatus();
      res.json(status);
    } catch (error) {
      logger.error("Error fetching scenario status", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/scenarios/:id/trigger
 * Trigger a scenario
 */
router.post(
  "/:id/trigger",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if scenario exists
      const scenario = scenarioService.getScenarioById(id);
      if (!scenario) {
        return res.status(404).json({
          error: {
            code: "SCENARIO_NOT_FOUND",
            message: `Scenario "${id}" not found`,
          },
        });
      }

      // Check if a scenario is already active
      if (scenarioService.isScenarioActive()) {
        const activeScenario = scenarioService.getActiveScenario();
        return res.status(409).json({
          error: {
            code: "SCENARIO_ALREADY_ACTIVE",
            message: `Scenario "${activeScenario?.config.name}" is already active. Stop it before starting a new one.`,
            activeScenario: activeScenario
              ? {
                  id: activeScenario.config.id,
                  name: activeScenario.config.name,
                  startTime: activeScenario.startTime,
                  endTime: activeScenario.endTime,
                }
              : undefined,
          },
        });
      }

      // Trigger the scenario
      const activeScenario = await scenarioService.triggerScenario(id);

      logger.info("Scenario triggered via API", {
        scenarioId: id,
        scenarioName: scenario.name,
      });

      return res.status(200).json({
        message: `Scenario "${scenario.name}" triggered successfully`,
        scenario: {
          id: activeScenario.config.id,
          name: activeScenario.config.name,
          description: activeScenario.config.description,
          startTime: activeScenario.startTime,
          endTime: activeScenario.endTime,
          duration: activeScenario.config.duration,
          status: activeScenario.status,
        },
      });
    } catch (error) {
      logger.error("Error triggering scenario", {
        scenarioId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        return res.status(400).json({
          error: {
            code: "SCENARIO_TRIGGER_FAILED",
            message: error.message,
          },
        });
      }

      return next(error);
    }
  }
);

/**
 * POST /api/v1/scenarios/stop
 * Stop the active scenario
 */
router.post(
  "/stop",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if a scenario is active
      if (!scenarioService.isScenarioActive()) {
        return res.status(404).json({
          error: {
            code: "NO_ACTIVE_SCENARIO",
            message: "No scenario is currently active",
          },
        });
      }

      const activeScenario = scenarioService.getActiveScenario();
      const scenarioName = activeScenario?.config.name;

      // Stop the scenario
      scenarioService.stopScenario();

      logger.info("Scenario stopped via API", {
        scenarioName,
      });

      return res.json({
        message: `Scenario "${scenarioName}" stopped successfully`,
      });
    } catch (error) {
      logger.error("Error stopping scenario", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(error);
    }
  }
);

export default router;
