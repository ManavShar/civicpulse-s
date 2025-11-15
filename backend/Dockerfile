# Multi-stage build for CivicPulse AI Backend
# Stage 1: Base - Install dependencies
FROM node:22-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --prefer-offline --no-audit

# Stage 2: Development
FROM base AS development

# Copy source code
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

# Stage 3: Build - Compile TypeScript
FROM base AS build

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 4: Production - Minimal runtime image
FROM node:22-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
