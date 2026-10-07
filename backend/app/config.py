from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Lab"
    app_env: str = "production"
    app_debug: bool = False
    app_secret_key: str
    app_ip_subnets: List[str] = ["192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12"]
    app_allowed_origins: List[str] = ["http://localhost:5173"]

    database_url: str = "sqlite+aiosqlite:////var/lib/lab/labdb.sqlite"
    storage_path: str = "/var/lib/lab/attachments"
    backup_path: str = "/var/lib/lab/backups"

    auth_access_token_expire_minutes: int = 43200
    auth_algorithm: str = "HS256"

    @field_validator("app_ip_subnets", "app_allowed_origins", mode="before")
    @classmethod
    def parse_csv_list(cls, value):
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


settings = Settings()
