from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Observabilidade - Logs e Dashboards"
    debug: bool = True
    database_url: str = "postgresql://postgres:password@postgres:5432/observabilidade"
    # Arquivo de cron gerenciado (bind-mount de /etc/cron.d na VM)
    cron_file: str = "/host-cron.d/observabilidade"
    # Diretório com os crontabs de usuários do host (ex.: /var/spool/cron/crontabs)
    crontab_spool_dir: str = "/host-crontabs"
    # Lista CSV dos usuários cujos crontabs devem aparecer na UI (ex.: root,ubuntu)
    crontab_users: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
