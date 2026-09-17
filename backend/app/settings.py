from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Secrets are supplied by the deployment, never committed."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="CIRCLE_", extra="ignore")

    database_url: str = "postgresql+psycopg://circle:circle@localhost:5432/circle"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000"
    claim_min_distinct_events: int = 3
    claim_min_distinct_months: int = 2

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
