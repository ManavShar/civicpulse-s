import { Request, Response, NextFunction } from "express";
import { authService } from "../routes/auth";
import { TokenPayload, UserRole } from "../types/auth";
import logger from "../utils/logger";

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No authorization header provided",
      });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Invalid authorization header format. Expected: Bearer <token>",
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
      return;
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user information to request
    req.user = payload;

    logger.debug("User authenticated", {
      userId: payload.userId,
      role: payload.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Token expired") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Token has expired",
        });
        return;
      }

      if (error.message === "Invalid token") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token",
        });
        return;
      }
    }

    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 *
 * @param roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      logger.warn("Authorization failed", {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        requiredRoles: roles,
        userRole: req.user.role,
      });
      return;
    }

    logger.debug("User authorized", {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user information if token is provided, but doesn't require it
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      if (token) {
        try {
          const payload = authService.verifyToken(token);
          req.user = payload;
        } catch (error) {
          // Silently fail for optional authentication
          logger.debug("Optional authentication failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
