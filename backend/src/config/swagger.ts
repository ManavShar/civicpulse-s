/**
 * Swagger/OpenAPI Configuration
 *
 * This file configures the OpenAPI 3.0 specification for the CivicPulse AI API.
 * It defines the API metadata, server information, security schemes, and common schemas.
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CivicPulse AI API",
      version: "1.0.0",
      description: `
CivicPulse AI is an autonomous smart city micro-operations platform that combines real-time digital twin visualization, 
predictive analytics, and multi-agent AI orchestration to detect, predict, and resolve urban infrastructure issues 
before they escalate.

## Features

- **Real-time Sensor Monitoring**: Stream data from simulated IoT sensors across the city
- **Incident Detection**: Automatically detect and classify infrastructure anomalies
- **Predictive Analytics**: Forecast potential failures using ML-powered time-series analysis
- **Multi-Agent AI**: Autonomous planning, dispatching, and analysis through coordinated AI agents
- **Work Order Management**: Track and simulate maintenance task lifecycle
- **Historical Replay**: Reconstruct and visualize past incident timelines
- **Scenario Demonstrations**: Trigger pre-configured city events for demonstrations

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain a token by calling the \`POST /api/v1/auth/login\` endpoint with valid credentials.

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.
Authentication endpoints have stricter limits of 5 attempts per 15 minutes.

## WebSocket Events

In addition to REST endpoints, the system provides real-time updates via WebSocket connections.
Connect to \`ws://localhost:3001\` and listen for events like:

- \`sensor:reading\` - New sensor data
- \`incident:created\` - New incident detected
- \`workorder:updated\` - Work order status changed
- \`agent:message\` - AI agent activity

## Error Responses

All error responses follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
\`\`\`
      `,
      contact: {
        name: "CivicPulse AI Team",
        email: "support@civicpulse.ai",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.civicpulse.ai",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check and system status endpoints",
      },
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      {
        name: "Sensors",
        description: "Sensor management and data retrieval",
      },
      {
        name: "Incidents",
        description: "Incident detection, management, and tracking",
      },
      {
        name: "Predictions",
        description: "Predictive analytics and forecasting",
      },
      {
        name: "Work Orders",
        description: "Work order creation and lifecycle management",
      },
      {
        name: "Replay",
        description: "Historical timeline reconstruction and playback",
      },
      {
        name: "Scenarios",
        description: "Demonstration scenario triggers and management",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /api/v1/auth/login endpoint",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                },
                message: {
                  type: "string",
                  example: "Invalid request parameters",
                },
                details: {
                  type: "object",
                  additionalProperties: true,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
                requestId: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
          },
        },
        GeoPoint: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["Point"],
              example: "Point",
            },
            coordinates: {
              type: "array",
              items: {
                type: "number",
              },
              minItems: 2,
              maxItems: 2,
              example: [-122.4194, 37.7749],
              description: "[longitude, latitude]",
            },
          },
          required: ["type", "coordinates"],
        },
        Sensor: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Waste Bin #42",
            },
            type: {
              type: "string",
              enum: [
                "WASTE",
                "LIGHT",
                "WATER",
                "TRAFFIC",
                "ENVIRONMENT",
                "NOISE",
              ],
              example: "WASTE",
            },
            location: {
              $ref: "#/components/schemas/GeoPoint",
            },
            zoneId: {
              type: "string",
              format: "uuid",
            },
            status: {
              type: "string",
              enum: ["online", "offline", "warning"],
              example: "online",
            },
            lastReading: {
              type: "number",
              example: 75.5,
            },
            lastReadingTime: {
              type: "string",
              format: "date-time",
            },
            metadata: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        SensorReading: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            sensorId: {
              type: "string",
              format: "uuid",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            value: {
              type: "number",
              example: 75.5,
            },
            unit: {
              type: "string",
              example: "%",
            },
            metadata: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        Incident: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            type: {
              type: "string",
              example: "WASTE_OVERFLOW",
            },
            category: {
              type: "string",
              enum: [
                "WASTE_OVERFLOW",
                "LIGHTING_FAILURE",
                "WATER_ANOMALY",
                "TRAFFIC_CONGESTION",
                "ENVIRONMENTAL_HAZARD",
                "NOISE_COMPLAINT",
              ],
            },
            severity: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              example: "HIGH",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "RESOLVED", "DISMISSED"],
              example: "ACTIVE",
            },
            priorityScore: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              example: 85,
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              example: 0.92,
            },
            location: {
              $ref: "#/components/schemas/GeoPoint",
            },
            zoneId: {
              type: "string",
              format: "uuid",
            },
            sensorId: {
              type: "string",
              format: "uuid",
            },
            description: {
              type: "string",
              example: "Waste bin overflow detected at Main Street",
            },
            scoringBreakdown: {
              type: "object",
              properties: {
                severity: {
                  type: "number",
                  example: 25,
                },
                urgency: {
                  type: "number",
                  example: 20,
                },
                publicImpact: {
                  type: "number",
                  example: 18,
                },
                environmentalCost: {
                  type: "number",
                  example: 12,
                },
                safetyRisk: {
                  type: "number",
                  example: 10,
                },
              },
            },
            detectedAt: {
              type: "string",
              format: "date-time",
            },
            resolvedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Prediction: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            sensorId: {
              type: "string",
              format: "uuid",
            },
            predictedTimestamp: {
              type: "string",
              format: "date-time",
            },
            predictedValue: {
              type: "number",
              example: 85.3,
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              example: 0.87,
            },
            lowerBound: {
              type: "number",
              example: 78.2,
            },
            upperBound: {
              type: "number",
              example: 92.4,
            },
            modelVersion: {
              type: "string",
              example: "prophet-v1.0",
            },
          },
        },
        WorkOrder: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            incidentId: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
              example: "Empty waste bin at Main Street",
            },
            description: {
              type: "string",
              example: "Waste bin overflow requires immediate attention",
            },
            status: {
              type: "string",
              enum: [
                "CREATED",
                "ASSIGNED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
              example: "ASSIGNED",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              example: "HIGH",
            },
            assignedUnitId: {
              type: "string",
              example: "UNIT-42",
            },
            location: {
              $ref: "#/components/schemas/GeoPoint",
            },
            zoneId: {
              type: "string",
              format: "uuid",
            },
            estimatedDuration: {
              type: "integer",
              description: "Estimated duration in minutes",
              example: 30,
            },
            estimatedCompletion: {
              type: "string",
              format: "date-time",
            },
            startedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Scenario: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "flood",
            },
            name: {
              type: "string",
              example: "Flash Flood Event",
            },
            description: {
              type: "string",
              example: "Sudden heavy rainfall causing localized flooding",
            },
            duration: {
              type: "integer",
              description: "Duration in milliseconds",
              example: 300000,
            },
            icon: {
              type: "string",
              example: "🌊",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
