from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache

# Placeholder value shipped in .env.example. Using it in production is unsafe
# because anyone who knows it can forge valid JWTs and impersonate any user.
_INSECURE_JWT_DEFAULT = "your-super-secret-key-change-me"

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    
    # Backend
    BACKEND_PORT: int = 8000
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "nlex_db"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    
    # This can be set directly (e.g. for sqlite tests)
    DATABASE_URL: str | None = None

    # Admin
    ADMIN_EMAIL: str = "admin@nlex.ai"
    # No default: the admin password must be provided via .env.secret only.
    ADMIN_PASSWORD: str

    # Trino
    TRINO_PORT: int = 8080
    
    # JWT
    JWT_SECRET_KEY: str = _INSECURE_JWT_DEFAULT
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # LLM
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL_FAST: str = "gpt-5.4-mini"
    LLM_MODEL_THINKING: str = "gpt-5.5"
    LLM_MODEL_INFERENCE: str = "deepseek-v4-flash"
    MAX_SQL_RETRIES: int = 3
    SYSTEM_PROXY_URL: str | None = None

    # CORS — comma-separated list of allowed origins.
    # Defaults cover local development; override in .env.secret for production.
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173,http://localhost:5174,http://127.0.0.1,http://127.0.0.1:5173,http://127.0.0.1:5174"
    
    @model_validator(mode="after")
    def _reject_insecure_secrets_in_production(self) -> "Settings":
        """
        Refuse to boot in production with the placeholder JWT secret.
        Keeping the default in development/test is fine, but in production it
        would allow anyone to forge tokens and impersonate any user.
        """
        if self.ENVIRONMENT.lower() == "production" and self.JWT_SECRET_KEY == _INSECURE_JWT_DEFAULT:
            raise ValueError(
                "JWT_SECRET_KEY is still set to the insecure default placeholder. "
                "Set a strong random JWT_SECRET_KEY in .env.secret before running in production."
            )
        return self

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://") and "+asyncpg" not in url:
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            if url.startswith("sqlite://") and "+aiosqlite" not in url:
                return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=".env.secret",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
