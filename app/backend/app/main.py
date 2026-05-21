from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import logs, dashboards, queries, cron
from app.seed import seed_default_dashboard

app = FastAPI(title=settings.app_name, debug=settings.debug)

# Create tables
Base.metadata.create_all(bind=engine)

# Seed do dashboard padrão (idempotente)
with SessionLocal() as _db:
    seed_default_dashboard(_db)

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


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.app_name}"}
