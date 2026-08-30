"""
Central app configuration. Reads from environment variables / .env file.
Never hardcode secrets here — this file only defines *where* to load them from.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = "postgresql+asyncpg://meetup_user:meetup_pass@localhost:5432/meetup_db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # SMS provider
    sms_provider_api_key: str = ""
    sms_provider_sender: str = ""

    # Cloudinary (for avatar uploads)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_upload_folder: str = "social-meetup/avatars"

    # Web Push (VAPID)
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_claims_email: str = ""

    # App
    environment: str = "development"
    debug: bool = True


settings = Settings()