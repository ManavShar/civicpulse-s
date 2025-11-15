import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import logger from "../utils/logger";
import { authLimiter, sensitiveLimiter } from "../middleware/rateLimiter";
import { authenticate, authorize } from "../middleware/authenticate";

const router = Router();

// Initialize repository and service
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["Admin", "Operator", "Viewer"]),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT tokens
 */
router.post(
  "/login",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { email, password } = LoginSchema.parse(req.body);

      // Authenticate user
      const result = await authService.login(email, password);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.issues,
        });
        return;
      }

      if (error instanceof Error && error.message === "Invalid credentials") {
        res.status(401).json({
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
        return;
      }

      logger.error("Login error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { refreshToken } = RefreshTokenSchema.parse(req.body);

      // Refresh token
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        (error.message === "Token expired" || error.message === "Invalid token")
      ) {
        res.status(401).json({
          error: "Invalid refresh token",
          message: error.message,
        });
        return;
      }

      logger.error("Token refresh error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/users
 * Create a new user (admin only)
 */
router.post(
  "/users",
  authenticate,
  authorize("Admin"),
  sensitiveLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { email, password, role } = CreateUserSchema.parse(req.body);

      // Create user
      const user = await authService.createUser(email, password, role);

      // Return user without password hash
      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "User with this email already exists"
      ) {
        res.status(409).json({
          error: "Conflict",
          message: error.message,
        });
        return;
      }

      logger.error("User creation error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/change-password
 * Change user password (authenticated users only)
 */
router.post(
  "/change-password",
  authenticate,
  sensitiveLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This will be protected by authenticate middleware
      // req.user will be set by the middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // Validate request body
      const { currentPassword, newPassword } = ChangePasswordSchema.parse(
        req.body
      );

      // Change password
      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        message: "Password changed successfully",
      });
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "Current password is incorrect"
      ) {
        res.status(400).json({
          error: "Invalid password",
          message: error.message,
        });
        return;
      }

      logger.error("Password change error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      next(error);
      return;
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user information
 */
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const user = await userRepository.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found",
        });
      }

      res.status(200).json({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
      return;
    } catch (error) {
      logger.error("Get current user error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      next(error);
      return;
    }
  }
);

export default router;
export { authService, userRepository };
