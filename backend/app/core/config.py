from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str
    DIRECT_URL: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_DEBUG: bool = False
    SMTP_MAX_RETRIES: int = 0
    SMTP_RETRY_DELAY_SECONDS: float = 1.0
    SMTP_TIMEOUT_SECONDS: float = 8.0

    # One-time admin bootstrap
    ADMIN_BOOTSTRAP_KEY: str = ""

    # Frontend (used in invite links)
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Scheduling/availability interpretation timezone for weekly day/time windows.
    SCHEDULING_TIMEZONE: str = "UTC"

    @property
    def allowed_origins_list(self) -> list[str]:
        raw_origins = [self.FRONTEND_URL, *self.ALLOWED_ORIGINS.split(",")]
        normalized_origins: list[str] = []

        for origin in raw_origins:
            normalized = origin.strip().rstrip("/")
            if normalized and normalized not in normalized_origins:
                normalized_origins.append(normalized)

        return normalized_origins


settings = Settings()
