"""
CivicPulse AI ML Pipeline Entry Point
FastAPI server for ML forecasting and predictions
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import settings
from database import db
from forecaster import forecaster
from model_storage import model_storage

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    # Startup
    logger.info("Starting ML Pipeline service...")

    # Test database connection
    db_connected = await db.test_connection()
    if not db_connected:
        logger.error("Failed to connect to database")
    else:
        logger.info("Database connection successful")

    # Cleanup expired models
    cleaned = model_storage.cleanup_expired_models()
    logger.info(f"Cleaned up {cleaned} expired models")

    yield

    # Shutdown
    logger.info("Shutting down ML Pipeline service...")
    db.close()


# Initialize FastAPI app
app = FastAPI(
    title="CivicPulse AI ML Pipeline",
    description="Machine Learning service for time-series forecasting and predictions",
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
    return {"status": "healthy", "service": "ml-pipeline", "version": "1.0.0"}


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    db_ready = await db.test_connection()

    return {
        "ready": db_ready,
        "checks": {"database": "up" if db_ready else "down", "model_storage": "up"},
    }


@app.get("/models")
async def list_models():
    """List all cached models"""
    try:
        models = model_storage.list_models()
        return {"count": len(models), "models": models}
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/models/{sensor_id}")
async def delete_model(sensor_id: str, model_type: str = "prophet"):
    """Delete a cached model"""
    try:
        deleted = model_storage.delete_model(sensor_id, model_type)
        if deleted:
            return {"message": f"Model deleted for sensor {sensor_id}"}
        else:
            raise HTTPException(status_code=404, detail="Model not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/cleanup")
async def cleanup_models():
    """Cleanup expired models"""
    try:
        deleted_count = model_storage.cleanup_expired_models()
        return {
            "message": f"Cleaned up {deleted_count} expired models",
            "deleted_count": deleted_count,
        }
    except Exception as e:
        logger.error(f"Error cleaning up models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Pydantic models for request/response
class SensorReading(BaseModel):
    """Sensor reading data point"""

    timestamp: str
    value: float


class ForecastRequest(BaseModel):
    """Request body for forecast endpoint"""

    sensor_id: str = Field(..., description="Sensor UUID")
    history: List[SensorReading] = Field(..., description="Historical sensor readings")
    horizons: Optional[List[int]] = Field(
        None, description="Forecast horizons in hours"
    )


class PredictionResponse(BaseModel):
    """Single prediction response"""

    sensor_id: str
    predicted_timestamp: str
    predicted_value: float
    confidence: float
    lower_bound: float
    upper_bound: float
    model_version: str
    horizon_hours: int


@app.post("/api/ml/forecast", response_model=List[PredictionResponse])
async def create_forecast(request: ForecastRequest):
    """
    Generate time-series forecast for a sensor

    Args:
        request: Forecast request with sensor_id, history, and horizons

    Returns:
        List of predictions for requested horizons
    """
    try:
        # Convert Pydantic models to dictionaries
        history = [
            {"timestamp": reading.timestamp, "value": reading.value}
            for reading in request.history
        ]

        # Generate forecast
        predictions = await forecaster.forecast(
            sensor_id=request.sensor_id, history=history, horizons=request.horizons
        )

        if not predictions:
            raise HTTPException(
                status_code=400,
                detail="Unable to generate forecast. Insufficient data or model error.",
            )

        # Convert datetime objects to ISO strings
        for pred in predictions:
            if isinstance(pred["predicted_timestamp"], datetime):
                pred["predicted_timestamp"] = pred["predicted_timestamp"].isoformat()

        return predictions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/forecast/{sensor_id}")
async def get_forecast_for_sensor(
    sensor_id: str, limit: int = 1000, horizons: Optional[str] = None
):
    """
    Generate forecast for a sensor using historical data from database

    Args:
        sensor_id: Sensor UUID
        limit: Number of historical readings to fetch
        horizons: Comma-separated list of horizons (e.g., "1,6,12,24")

    Returns:
        List of predictions
    """
    try:
        # Parse horizons
        horizon_list = None
        if horizons:
            horizon_list = [int(h.strip()) for h in horizons.split(",")]

        # Fetch historical data
        history = await db.fetch_sensor_readings(sensor_id, limit=limit)

        if not history:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for sensor {sensor_id}",
            )

        # Generate forecast
        predictions = await forecaster.forecast(
            sensor_id=sensor_id, history=history, horizons=horizon_list
        )

        if not predictions:
            raise HTTPException(status_code=400, detail="Unable to generate forecast")

        # Convert datetime objects to ISO strings
        for pred in predictions:
            if isinstance(pred["predicted_timestamp"], datetime):
                pred["predicted_timestamp"] = pred["predicted_timestamp"].isoformat()

        return predictions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating forecast for sensor {sensor_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/models/{sensor_id}")
async def get_model_info(sensor_id: str):
    """Get information about cached model for a sensor"""
    try:
        model_info = forecaster.get_model_info(sensor_id)

        if model_info is None:
            raise HTTPException(
                status_code=404, detail=f"No cached model found for sensor {sensor_id}"
            )

        return model_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/ml/models/{sensor_id}")
async def invalidate_sensor_model(sensor_id: str):
    """Invalidate cached model for a sensor"""
    try:
        deleted = forecaster.invalidate_model(sensor_id)

        if deleted:
            return {"message": f"Model invalidated for sensor {sensor_id}"}
        else:
            raise HTTPException(
                status_code=404, detail=f"No cached model found for sensor {sensor_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error invalidating model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
