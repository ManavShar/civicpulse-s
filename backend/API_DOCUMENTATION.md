# CivicPulse AI - API Documentation

## Overview

The CivicPulse AI backend provides a comprehensive RESTful API for managing smart city operations, including sensor monitoring, incident detection, predictive analytics, and AI-powered work order management.

## Interactive API Documentation

### Accessing Swagger UI

Once the backend server is running, you can access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

The Swagger UI provides:

- **Interactive API Explorer**: Test endpoints directly from your browser
- **Request/Response Examples**: See example payloads for all endpoints
- **Schema Definitions**: Detailed data model documentation
- **Authentication Testing**: Try authenticated endpoints with JWT tokens

### OpenAPI Specification

The raw OpenAPI 3.0 specification is available in JSON format at:

```
http://localhost:3001/api-docs/openapi.json
```

You can import this specification into tools like:

- Postman
- Insomnia
- API testing frameworks
- Code generators

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Navigate to API Documentation

Open your browser and go to:

```
http://localhost:3001/api-docs
```

### 3. Authenticate

Most endpoints require authentication. To get started:

1. Click on the **POST /api/v1/auth/login** endpoint
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "admin@civicpulse.ai",
     "password": "admin123"
   }
   ```
4. Click "Execute"
5. Copy the `accessToken` from the response
6. Click the "Authorize" button at the top of the page
7. Enter: `Bearer <your-access-token>`
8. Click "Authorize"

Now you can test all authenticated endpoints!

## API Endpoints Overview

### Health & Status

- `GET /health` - Basic health check
- `GET /ready` - Readiness check with dependency status

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/users` - Create user (Admin only)
- `POST /api/v1/auth/change-password` - Change password

### Sensors

- `GET /api/v1/sensors` - List all sensors
- `GET /api/v1/sensors/{id}` - Get sensor details
- `GET /api/v1/sensors/{id}/readings` - Get sensor readings
- `POST /api/v1/sensors/{id}/configure` - Update sensor config
- `POST /api/v1/sensors/{id}/start` - Start sensor simulation
- `POST /api/v1/sensors/{id}/stop` - Stop sensor simulation

### Incidents

- `GET /api/v1/incidents` - List incidents with filtering
- `GET /api/v1/incidents/{id}` - Get incident details
- `POST /api/v1/incidents` - Create manual incident
- `PATCH /api/v1/incidents/{id}` - Update incident
- `DELETE /api/v1/incidents/{id}` - Dismiss incident

### Predictions

- `GET /api/v1/predictions` - List predictions
- `GET /api/v1/predictions/sensor/{sensorId}` - Get predictions for sensor
- `POST /api/v1/predictions/refresh` - Trigger prediction refresh

### Work Orders

- `GET /api/v1/work-orders` - List work orders
- `GET /api/v1/work-orders/{id}` - Get work order details
- `POST /api/v1/work-orders` - Create work order
- `PATCH /api/v1/work-orders/{id}/status` - Update work order status

### Replay

- `GET /api/v1/replay/timeline` - Get historical timeline
- `GET /api/v1/replay/snapshot/{timestamp}` - Get system snapshot

### Scenarios

- `GET /api/v1/scenarios` - List available scenarios
- `POST /api/v1/scenarios/{id}/trigger` - Trigger scenario
- `POST /api/v1/scenarios/stop` - Stop active scenario
- `GET /api/v1/scenarios/status` - Get scenario status

## WebSocket Events

In addition to REST endpoints, the system provides real-time updates via WebSocket:

**Connection URL**: `ws://localhost:3001`

**Events**:

- `sensor:reading` - New sensor data
- `sensor:anomaly` - Anomaly detected
- `incident:created` - New incident
- `incident:updated` - Incident updated
- `incident:resolved` - Incident resolved
- `workorder:created` - Work order created
- `workorder:updated` - Work order updated
- `agent:message` - AI agent activity
- `agent:plan_created` - Action plan created
- `agent:dispatched` - Work order dispatched
- `agent:explained` - Explanation generated

## Rate Limiting

- **Standard API endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 attempts per 15 minutes per IP
- **Sensitive operations**: 10 requests per 15 minutes per IP

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

**Common Error Codes**:

- `VALIDATION_ERROR` - Invalid request parameters
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `SENSOR_NOT_FOUND` - Specific sensor not found
- `INCIDENT_NOT_FOUND` - Specific incident not found
- `INTERNAL_ERROR` - Server error

## Development

### Adding New Endpoints

When adding new endpoints, document them using JSDoc comments with Swagger annotations:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get("/your-endpoint", async (req, res) => {
  // Implementation
});
```

### Updating Schemas

Common schemas are defined in `backend/src/config/swagger.ts` under `components.schemas`. Add new schemas there for reuse across endpoints.

### Testing Documentation

After making changes:

1. Rebuild the project: `npm run build`
2. Restart the server: `npm run dev`
3. Refresh the Swagger UI: `http://localhost:3001/api-docs`
4. Verify your changes appear correctly

## Support

For issues or questions about the API:

- Check the interactive documentation at `/api-docs`
- Review the OpenAPI spec at `/api-docs/openapi.json`
- Consult the main README.md for system architecture
- Check backend logs for detailed error information

## License

MIT License - See LICENSE file for details
