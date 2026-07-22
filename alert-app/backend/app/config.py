from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://alertguard:alertguard@localhost:5432/alertguard"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "a3f5b8c1d4e7a2b6f9c3d1e5a8b2f4c7d9e1a3b5f8c2d4e6a9b1f3c5d7e9a1"
    OPENWEATHER_API_KEY: str = ""
    NASA_FIRMS_KEY: str = ""
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:8081"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
