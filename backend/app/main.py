from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import logs, dashboards, queries, docker_manager

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, debug=settings.debug)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(logs.router, prefix="/api", tags=["logs"])
app.include_router(dashboards.router, prefix="/api", tags=["dashboards"])
app.include_router(queries.router, prefix="/api", tags=["queries"])
app.include_router(docker_manager.router, prefix="/api", tags=["docker"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.app_name}"}
