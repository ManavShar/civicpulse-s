import rateLimit from "express-rate-limit";
import logger from "../utils/logger";

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === "/health" || req.path === "/ready";
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 * Prevents brute force attacks on login
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too Many Requests",
    message:
      "Too many authentication attempts from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      email: req.body?.email,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Too many authentication attempts. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Moderate rate limiter for write operations
 * Limits: 30 requests per 15 minutes per IP
 * Prevents abuse of POST/PUT/PATCH/DELETE endpoints
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 write requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many write operations from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Write rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Too many write operations. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
  skip: (req) => {
    // Only apply to write operations
    return !["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  },
});

/**
 * Lenient rate limiter for read operations
 * Limits: 200 requests per 15 minutes per IP
 * Allows more frequent reads for dashboard updates
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many read requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Read rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Too many read requests. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
  skip: (req) => {
    // Only apply to read operations
    return req.method !== "GET";
  },
});

/**
 * Very strict rate limiter for sensitive operations
 * Limits: 3 requests per hour per IP
 * For operations like password changes, user creation
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: "Too Many Requests",
    message:
      "Too many sensitive operations from this IP, please try again later.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Sensitive operation rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Too many sensitive operations. Please try again in an hour.",
      retryAfter: "1 hour",
    });
  },
});
