"""
CivicPulse AI Agent Runtime Entry Point
FastAPI application for multi-agent AI system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys

from config import settings
from database import db
from redis_client import redis_client

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    # Startup
    logger.info("Starting CivicPulse AI Agent Runtime...")

    try:
        # Initialize database connection
        db.connect()
        logger.info("Database connected")

        # Initialize Redis connection
        await redis_client.connect()
        logger.info("Redis connected")

        logger.info("Agent Runtime started successfully")
        yield

    except Exception as e:
        logger.error(f"Failed to start Agent Runtime: {e}")
        raise

    finally:
        # Shutdown
        logger.info("Shutting down Agent Runtime...")
        db.close()
        await redis_client.close()
        logger.info("Agent Runtime shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="CivicPulse AI Agent Runtime",
    description="Multi-agent AI system for smart city operations",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "agent-runtime", "version": "1.0.0"}


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    try:
        # Check database connection
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")

        # Check Redis connection
        await redis_client.client.ping()

        return {"status": "ready", "database": "connected", "redis": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")


# Include agent routes
from routes import router as agent_router

app.include_router(agent_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
