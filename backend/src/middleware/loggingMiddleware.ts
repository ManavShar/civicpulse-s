import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

/**
 * HTTP request logging middleware
 * Logs all incoming requests and their responses with timing information
 */
export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log request
  logger.info("Incoming request", {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    res.send = originalSend;

    const duration = Date.now() - startTime;

    // Log response
    logger.info("Request completed", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return res.send(data);
  };

  next();
}
