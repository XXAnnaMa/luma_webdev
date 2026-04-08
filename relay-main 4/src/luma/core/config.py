import json
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["local", "dev", "test", "staging", "prod"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Luma API"
    environment: Environment = "local"
    api_v1_prefix: str = "/api/v1"

    # Course-friendly defaults: local/dev get debug + docs unless explicitly overridden.
    debug: bool | None = None
    docs_enabled: bool | None = None
    redoc_enabled: bool | None = None
    openapi_enabled: bool | None = None

    cors_allow_origins: str = Field(
        default='["http://localhost:3000", "http://127.0.0.1:3000"]',
        description="CORS Allowed Origins",
    )
    trusted_hosts: str = Field(
        default='["localhost", "127.0.0.1"]',
        description="Trusted Hosts",
    )

    @field_validator("cors_allow_origins", "trusted_hosts", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        if isinstance(v, str) and v.startswith("["):
            return ",".join(json.loads(v))
        return v

    database_url: str = Field(
        default="postgresql+asyncpg://postgres@localhost:5432/luma",
        description="Async SQLAlchemy database URL",
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL",
    )
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key for chatbot integration",
    )
    openai_model: str = Field(
        default="gpt-4o-mini",
        description="OpenAI chat model name",
    )
    openai_timeout_seconds: float = Field(
        default=20.0,
        description="OpenAI request timeout in seconds",
    )

    session_ttl_seconds: int = Field(
        default=86400,
        description="Session TTL in seconds (default 24h)",
    )
    session_cookie_name: str = Field(
        default="session_id",
        description="Name of the session cookie",
    )

    @property
    def is_local(self) -> bool:
        return self.environment in {"local", "dev", "test"}

    @property
    def effective_debug(self) -> bool:
        return self.is_local if self.debug is None else self.debug

    @property
    def effective_docs_enabled(self) -> bool:
        return self.is_local if self.docs_enabled is None else self.docs_enabled

    @property
    def effective_redoc_enabled(self) -> bool:
        return self.is_local if self.redoc_enabled is None else self.redoc_enabled

    @property
    def effective_openapi_enabled(self) -> bool:
        return self.is_local if self.openapi_enabled is None else self.openapi_enabled


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
