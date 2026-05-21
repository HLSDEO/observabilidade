from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Observabilidade - Logs e Dashboards"
    debug: bool = True
    database_url: str = "postgresql://postgres:password@postgres:5432/observabilidade"

    class Config:
        env_file = ".env"


settings = Settings()
