from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from pathlib import Path


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # Optional so the service can boot even before keys are configured.
    # Endpoints surface a clean 503 when a required key is missing, instead of
    # crashing the whole app at import time.
    groq_api_key: Optional[str] = ""
    gemini_api_key: Optional[str] = ""
    fireworks_api_key: Optional[str] = ""
    spoonacular_api_key: Optional[str] = ""
    calorieninjas_api_key: Optional[str] = ""
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"
    redis_url: Optional[str] = None
    cache_ttl: int = 3600

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()