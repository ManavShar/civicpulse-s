# Authentication and Authorization

This document explains how to use the authentication and authorization system in the CivicPulse AI backend.

## Overview

The authentication system uses JWT (JSON Web Tokens) for stateless authentication. It includes:

- User authentication with email/password
- JWT token generation and verification
- Role-based access control (RBAC)
- Rate limiting for security
- Password hashing with bcrypt (work factor 10)

## User Roles

The system supports three user roles with different permission levels:

- **Admin**: Full access to all endpoints, can create users
- **Operator**: Can view and modify incidents, work orders, and scenarios
- **Viewer**: Read-only access to all data

## Default Users

The system comes with three default users (created by migration):

```
Admin:
  Email: admin@civicpulse.ai
  Password: admin123

Operator:
  Email: operator@civicpulse.ai
  Password: operator123

Viewer:
  Email: viewer@civicpulse.ai
  Password: viewer123
```

**Note**: Change these passwords in production!

## API Endpoints

### POST /api/v1/auth/login

Authenticate user and receive JWT tokens.

**Request:**

```json
{
  "email": "admin@civicpulse.ai",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@civicpulse.ai",
    "role": "Admin"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/v1/auth/me

Get current user information (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "uuid",
  "email": "admin@civicpulse.ai",
  "role": "Admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/v1/auth/change-password

Change user password (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "currentPassword": "admin123",
  "newPassword": "newSecurePassword123"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

**Rate Limit**: 3 requests per hour

### POST /api/v1/auth/users

Create a new user (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "email": "newuser@civicpulse.ai",
  "password": "securePassword123",
  "role": "Operator"
}
```

**Response:**

```json
{
  "id": "uuid",
  "email": "newuser@civicpulse.ai",
  "role": "Operator",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Rate Limit**: 3 requests per hour

## Using Authentication in Routes

### Protecting Routes with Authentication

To require authentication for a route, use the `authenticate` middleware:

```typescript
import { authenticate } from "../middleware/authenticate";

router.get("/protected", authenticate, async (req, res) => {
  // req.user contains the authenticated user's information
  const userId = req.user.userId;
  const userRole = req.user.role;

  res.json({ message: "This is a protected route" });
});
```

### Protecting Routes with Authorization

To require specific roles, use the `authorize` middleware:

```typescript
import { authenticate, authorize } from "../middleware/authenticate";

// Only Admin can access
router.post(
  "/admin-only",
  authenticate,
  authorize("Admin"),
  async (req, res) => {
    res.json({ message: "Admin only route" });
  }
);

// Admin or Operator can access
router.post(
  "/operators",
  authenticate,
  authorize("Admin", "Operator"),
  async (req, res) => {
    res.json({ message: "Admin or Operator route" });
  }
);
```

### Optional Authentication

For routes that should work with or without authentication:

```typescript
import { optionalAuthenticate } from "../middleware/authenticate";

router.get("/public", optionalAuthenticate, async (req, res) => {
  if (req.user) {
    // User is authenticated
    res.json({ message: `Hello ${req.user.userId}` });
  } else {
    // User is not authenticated
    res.json({ message: "Hello anonymous user" });
  }
});
```

## Rate Limiting

The system includes several rate limiters:

### API Limiter (General)

- **Limit**: 100 requests per 15 minutes
- **Applied to**: All `/api/*` routes
- **Excludes**: Health check endpoints

### Auth Limiter (Authentication)

- **Limit**: 5 requests per 15 minutes
- **Applied to**: `/api/v1/auth/login`
- **Skips**: Successful requests (only counts failed attempts)

### Sensitive Limiter

- **Limit**: 3 requests per hour
- **Applied to**: Password changes, user creation

### Write Limiter

- **Limit**: 30 requests per 15 minutes
- **Applied to**: POST, PUT, PATCH, DELETE operations

### Read Limiter

- **Limit**: 200 requests per 15 minutes
- **Applied to**: GET operations

## Example: Protecting Incident Routes

```typescript
import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate";
import { writeLimiter } from "../middleware/rateLimiter";

const router = Router();

// Anyone can view incidents (with optional auth for personalization)
router.get("/", optionalAuthenticate, async (req, res) => {
  // Get incidents...
});

// Authenticated users can view incident details
router.get("/:id", authenticate, async (req, res) => {
  // Get incident by ID...
});

// Only Admin and Operator can create incidents
router.post(
  "/",
  authenticate,
  authorize("Admin", "Operator"),
  writeLimiter,
  async (req, res) => {
    // Create incident...
  }
);

// Only Admin and Operator can update incidents
router.patch(
  "/:id",
  authenticate,
  authorize("Admin", "Operator"),
  writeLimiter,
  async (req, res) => {
    // Update incident...
  }
);

// Only Admin can delete incidents
router.delete(
  "/:id",
  authenticate,
  authorize("Admin"),
  writeLimiter,
  async (req, res) => {
    // Delete incident...
  }
);

export default router;
```

## Environment Variables

Configure authentication in your `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/civicpulse
```

## Security Best Practices

1. **Change Default Passwords**: Always change the default user passwords in production
2. **Use Strong JWT Secret**: Generate a strong random secret for JWT_SECRET
3. **HTTPS Only**: Always use HTTPS in production to protect tokens in transit
4. **Token Expiration**: Keep token expiration times reasonable (24h for access, 7d for refresh)
5. **Rate Limiting**: The built-in rate limiters help prevent brute force attacks
6. **Password Requirements**: Enforce strong password requirements (min 8 characters)
7. **Bcrypt Work Factor**: The system uses bcrypt with work factor 10 for password hashing

## Testing Authentication

### Using curl

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@civicpulse.ai","password":"admin123"}'

# Use token
TOKEN="your-token-here"
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create a POST request to `/api/v1/auth/login`
2. Set body to JSON with email and password
3. Copy the token from the response
4. For protected routes, add header: `Authorization: Bearer <token>`

## Troubleshooting

### "No token provided" error

- Make sure you're including the `Authorization` header
- Format must be: `Authorization: Bearer <token>`

### "Token expired" error

- Use the refresh token endpoint to get a new access token
- Or login again to get new tokens

### "Insufficient permissions" error

- Your user role doesn't have access to this endpoint
- Check the required roles for the endpoint

### Rate limit exceeded

- Wait for the rate limit window to reset
- Check the `Retry-After` header for timing information
