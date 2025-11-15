/**
 * Seed default users for CivicPulse AI
 * Creates Admin, Operator, and Viewer users with default passwords
 */

import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import db from "../db/connection";
import logger from "../utils/logger";

const DEFAULT_USERS = [
  {
    email: "admin@civicpulse.ai",
    password: "admin123",
    role: "Admin" as const,
  },
  {
    email: "operator@civicpulse.ai",
    password: "operator123",
    role: "Operator" as const,
  },
  {
    email: "viewer@civicpulse.ai",
    password: "viewer123",
    role: "Viewer" as const,
  },
];

async function seedUsers() {
  try {
    logger.info("Starting user seeding...");

    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Initialize services
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository);

    // Create default users
    for (const userData of DEFAULT_USERS) {
      try {
        // Check if user already exists
        const existingUser = await userRepository.findByEmail(userData.email);

        if (existingUser) {
          logger.info(`User already exists: ${userData.email}`);
          continue;
        }

        // Create user
        const user = await authService.createUser(
          userData.email,
          userData.password,
          userData.role
        );

        logger.info(`Created user: ${user.email} (${user.role})`);
      } catch (error) {
        logger.error(`Failed to create user ${userData.email}`, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info("User seeding completed successfully");
    logger.info("");
    logger.info("Default users:");
    logger.info("  Admin:    admin@civicpulse.ai / admin123");
    logger.info("  Operator: operator@civicpulse.ai / operator123");
    logger.info("  Viewer:   viewer@civicpulse.ai / viewer123");
    logger.info("");
    logger.warn("⚠️  IMPORTANT: Change these passwords in production!");

    process.exit(0);
  } catch (error) {
    logger.error("User seeding failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedUsers();
}

export { seedUsers };
