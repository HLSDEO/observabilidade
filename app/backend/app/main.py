from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.app_name}"}

# Placeholder endpoints
@app.post("/api/logs")
def create_log(data: dict):
    return {"id": "test", **data}

@app.get("/api/dashboards")
def list_dashboards():
    return []

@app.post("/api/queries/aggregate")
def aggregate(data: dict):
    return {"aggregation": "placeholder"}
