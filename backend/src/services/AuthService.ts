import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository";
import {
  User,
  UserRole,
  TokenPayload,
  LoginResponse,
  RefreshTokenResponse,
} from "../types/auth";
import logger from "../utils/logger";

/**
 * Authentication service handling JWT tokens and password verification
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;
  private readonly refreshTokenExpiration: string;
  private readonly bcryptWorkFactor: number = 10;

  constructor(private userRepository: UserRepository) {
    this.jwtSecret =
      process.env.JWT_SECRET || "default-secret-change-in-production";
    this.jwtExpiration = process.env.JWT_EXPIRATION || "24h";
    this.refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION || "7d";

    if (this.jwtSecret === "default-secret-change-in-production") {
      logger.warn(
        "Using default JWT secret - this should be changed in production!"
      );
    }
  }

  /**
   * Hash a password using bcrypt with work factor 10
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptWorkFactor);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiration,
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn("Login attempt with non-existent email", { email });
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(
      password,
      user.passwordHash
    );
    if (!isValidPassword) {
      logger.warn("Login attempt with invalid password", {
        email,
        userId: user.id,
      });
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const payload = this.verifyToken(refreshToken);

    // Get user from database
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new tokens
    const newToken = this.generateToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    logger.info("Token refreshed successfully", { userId: user.id });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Create a new user (for admin use)
   */
  async createUser(
    email: string,
    password: string,
    role: UserRole
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.userRepository.createUser(
      email,
      passwordHash,
      role
    );

    logger.info("User created successfully", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(
      currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.updatePassword(userId, newPasswordHash);

    logger.info("Password changed successfully", { userId });
  }

  /**
   * Validate token and return user
   */
  async validateToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
