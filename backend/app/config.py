from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/observabilidade_logs"
    app_name: str = "Observabilidade Logs"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
