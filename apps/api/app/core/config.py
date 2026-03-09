from functools import lru_cache
from pydantic import BaseSettings, AnyHttpUrl
from typing import List
import os


class Settings(BaseSettings):
    env: str = os.getenv("ENV", "local")

    database_url: str = os.getenv("DATABASE_URL", "")

    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    frontend_port: int = int(os.getenv("FRONTEND_PORT", "3000"))

    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_storage_bucket: str = os.getenv("SUPABASE_STORAGE_BUCKET", "rfp-documents")

    backend_cors_origins: List[AnyHttpUrl] = []

    class Config:
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()

