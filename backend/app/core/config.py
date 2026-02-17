from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = "Team Task Board"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/taskboard",
        description="Postgres connection string"
    )
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production-min-32-chars",
        description="Secret key for JWT token signing"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


def get_settings() -> Settings:
    return Settings()
