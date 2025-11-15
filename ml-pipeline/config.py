"""
Configuration management for ML Pipeline
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database Configuration
    database_url: str = (
        "postgresql://civicpulse:civicpulse_dev@localhost:5432/civicpulse"
    )

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"

    # Model Configuration
    model_cache_dir: str = "./models"
    model_cache_ttl: int = 3600  # seconds

    # Forecasting Configuration
    forecast_horizons: str = "1,6,12,24"  # hours
    forecast_confidence: float = 0.95

    # Logging Configuration
    log_level: str = "INFO"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8002

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def forecast_horizons_list(self) -> List[int]:
        """Parse forecast horizons from comma-separated string"""
        return [int(h.strip()) for h in self.forecast_horizons.split(",")]


# Global settings instance
settings = Settings()
