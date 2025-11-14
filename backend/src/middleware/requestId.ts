import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Request ID middleware for distributed tracing
 * Adds a unique request ID to each request for tracking across logs
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();

  // Attach to request object
  req.id = requestId;

  // Add to response headers
  res.setHeader("X-Request-ID", requestId);

  next();
}

// Extend Express Request type to include id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
