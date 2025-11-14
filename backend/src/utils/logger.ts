import winston from "winston";
import path from "path";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LOG_FORMAT = process.env.LOG_FORMAT || "json";

/**
 * Create Winston logger with structured JSON logging
 * Supports multiple transports: console, file, and error file
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({
      fillExcept: ["message", "level", "timestamp", "label"],
    }),
    LOG_FORMAT === "json"
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, metadata }) => {
          const meta = metadata as Record<string, any>;
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
        })
  ),
  transports: [
    // Console transport for all logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: process.env.NODE_ENV !== "production" }),
        winston.format.printf(({ timestamp, level, message, metadata }) => {
          const meta = metadata as Record<string, any>;
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add file transports in production or when LOG_DIR is set
if (process.env.NODE_ENV === "production" || process.env.LOG_DIR) {
  const logDir = process.env.LOG_DIR || path.join(__dirname, "../../logs");

  // All logs file
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Error logs file
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

export default logger;
