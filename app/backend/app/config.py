from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Observabilidade - Logs e Dashboards"
    debug: bool = True
    database_url: str = "postgresql://postgres:password@postgres:5432/observabilidade"
    # Arquivo de cron gerenciado (bind-mount de /etc/cron.d na VM)
    cron_file: str = "/host-cron.d/observabilidade"

    class Config:
        env_file = ".env"


settings = Settings()
