import logging
import logging.config
import threading
import time
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import exc as sql_exc
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import logs, dashboards, queries, cron, docker_manager
from app.seed import seed_default_dashboard
from app.seed_pncp import seed_pncp_dashboard

# Configure logging
logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "access": {
            "format": "[%(asctime)s] %(levelname)s %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "access_console": {
            "class": "logging.StreamHandler",
            "formatter": "access",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "": {"handlers": ["console"], "level": "INFO"},
        "uvicorn.access": {"handlers": ["access_console"], "level": "INFO", "propagate": False},
        "app": {"level": "DEBUG"},
        "sqlalchemy": {"level": "WARNING"},
    },
}

logging.config.dictConfig(logging_config)
logger = logging.getLogger(__name__)
access_logger = logging.getLogger("uvicorn.access")

_db_healthy = False


def _init_db_with_retry() -> None:
    """Inicializa o banco em background, com retry infinito.

    Assim o backend sempre sobe e atende /health e /api/docker mesmo se o
    postgres estiver fora — permitendo, inclusive, religar o postgres pela
    própria tela do Docker Manager. Rotas que usam o banco falham até ele voltar.
    """
    global _db_healthy
    delay = 3
    while True:
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as _db:
                seed_default_dashboard(_db)
                seed_pncp_dashboard(_db)
            logger.info("✓ Banco inicializado com sucesso")
            _db_healthy = True
            return
        except Exception as exc:
            _db_healthy = False
            logger.warning(
                "✗ Banco indisponível (%s). Nova tentativa em %ss...", type(exc).__name__, delay
            )
            time.sleep(delay)


# Roda em background para não bloquear o startup do servidor.
init_thread = threading.Thread(target=_init_db_with_retry, daemon=True)
init_thread.start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Backend iniciando...")
    yield
    logger.info("🛑 Backend desligando...")


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)


# Middleware para logging de requisições
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        status_code = response.status_code
        status_emoji = "✓" if status_code < 400 else "⚠" if status_code < 500 else "✗"

        access_logger.info(
            f"{status_emoji} {request.method} {request.url.path} {status_code} ({duration:.3f}s)"
        )
        return response
    except Exception as exc:
        duration = time.time() - start_time
        logger.error(
            f"✗ {request.method} {request.url.path} - Exception: {type(exc).__name__} ({duration:.3f}s)",
            exc_info=True,
        )
        raise


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
    """Valida saúde do backend e banco de dados."""
    if not _db_healthy:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": "Database not ready",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    try:
        with SessionLocal() as db:
            db.execute("SELECT 1")
        return {
            "status": "healthy",
            "message": "Backend and database OK",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": f"Database error: {type(e).__name__}",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


@app.exception_handler(sql_exc.SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: sql_exc.SQLAlchemyError):
    """Trata erros de banco de dados globalmente."""
    logger.error(
        f"Database error on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=503,
        content={
            "error": "Database error",
            "message": "Please try again later",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "timestamp": datetime.utcnow().isoformat(),
    }
