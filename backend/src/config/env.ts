/**
 * Environment configuration loader
 * This file MUST be imported first before any other modules
 */
import dotenv from "dotenv";
import path from "path";

// Load environment variables
const result = dotenv.config();

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  process.exit(1);
}

console.log("✓ Environment variables loaded");
console.log("  - NODE_ENV:", process.env.NODE_ENV || "not set");
console.log(
  "  - DATABASE_URL:",
  process.env.DATABASE_URL ? "✓ set" : "✗ not set"
);
console.log("  - PORT:", process.env.PORT || "not set");

// Export environment variables with defaults
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  agentServiceUrl: process.env.AGENT_SERVICE_URL || "http://localhost:8001",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8002",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Validate required environment variables
if (!config.databaseUrl) {
  console.error("❌ DATABASE_URL is required but not set in .env file");
  process.exit(1);
}
