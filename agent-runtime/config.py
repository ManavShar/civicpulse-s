"""
Configuration management for CivicPulse AI Agent Runtime
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4-turbo-preview"
    openai_temperature: float = 0.7
    openai_max_tokens: int = 2000

    # Database Configuration
    database_url: str

    # Redis Configuration
    redis_url: str

    # Backend Service URL
    backend_url: str = "http://localhost:4000"

    # Agent Configuration
    agent_memory_ttl: int = 3600  # 1 hour
    agent_timeout: int = 30  # 30 seconds
    agent_max_retries: int = 3

    # Logging Configuration
    log_level: str = "INFO"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
