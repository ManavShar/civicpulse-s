/**
 * API Documentation routes
 *
 * Serves interactive Swagger UI for API documentation
 */

import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../config/swagger";

const router = Router();

// Serve Swagger UI
router.use("/", swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "CivicPulse AI API Documentation",
    customfavIcon: "/favicon.ico",
  })
);

// Serve raw OpenAPI spec as JSON
router.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default router;
