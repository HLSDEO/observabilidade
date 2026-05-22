import logging
import threading
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import logs, dashboards, queries, cron, docker_manager
from app.seed import seed_default_dashboard

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title=settings.app_name, debug=settings.debug)


def _init_db_with_retry() -> None:
    """Inicializa o banco em background, com retry infinito.

    Assim o backend sempre sobe e atende /health e /api/docker mesmo se o
    postgres estiver fora — permitindo, inclusive, religar o postgres pela
    própria tela do Docker Manager. Rotas que usam o banco falham até ele voltar.
    """
    delay = 3
    while True:
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as _db:
                seed_default_dashboard(_db)
            logger.info("Banco inicializado com sucesso.")
            return
        except Exception as exc:
            logger.warning(
                "Banco indisponível (%s). Nova tentativa em %ss...", exc, delay
            )
            time.sleep(delay)


# Roda em background para não bloquear o startup do servidor.
threading.Thread(target=_init_db_with_retry, daemon=True).start()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(logs.router)
app.include_router(dashboards.router)
app.include_router(queries.router)
app.include_router(cron.router)
app.include_router(docker_manager.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.app_name}"}
