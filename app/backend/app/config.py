from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Observabilidade - Logs e Dashboards"
    debug: bool = True
    database_url: str = "postgresql://postgres:postgres@postgres:5432/observabilidade_logs"

    # Database pool settings
    db_pool_size: int = 10  # Number of connections to keep in pool
    db_max_overflow: int = 20  # Max additional connections beyond pool_size
    db_pool_recycle: int = 3600  # Recycle connections after 1 hour

    # Arquivo de cron gerenciado (bind-mount de /etc/cron.d na VM)
    cron_file: str = "/host-cron.d/observabilidade"
    # Diretório com os crontabs de usuários do host (ex.: /var/spool/cron/crontabs)
    crontab_spool_dir: str = "/host-crontabs"
    # Lista CSV dos usuários cujos crontabs devem aparecer na UI (ex.: root,ubuntu)
    crontab_users: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
