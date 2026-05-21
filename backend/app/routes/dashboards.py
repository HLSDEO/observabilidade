from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DashboardCreate, DashboardUpdate, DashboardResponse
from app.models import Dashboard

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

@router.post("/", response_model=DashboardResponse, status_code=201)
def create_dashboard(dashboard: DashboardCreate, db: Session = Depends(get_db)):
    """Criar novo dashboard"""
    db_dashboard = Dashboard(
        name=dashboard.name,
        description=dashboard.description,
        config=dashboard.config,
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard

@router.get("/", response_model=list[DashboardResponse])
def list_dashboards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Listar todos os dashboards"""
    return db.query(Dashboard).offset(skip).limit(limit).all()

@router.get("/{dashboard_id}", response_model=DashboardResponse)
def get_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    """Obter um dashboard por ID"""
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard

@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: str,
    dashboard_update: DashboardUpdate,
    db: Session = Depends(get_db),
):
    """Atualizar um dashboard"""
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard_update.name:
        dashboard.name = dashboard_update.name
    if dashboard_update.description is not None:
        dashboard.description = dashboard_update.description
    if dashboard_update.config:
        dashboard.config = dashboard_update.config

    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard

@router.delete("/{dashboard_id}", status_code=204)
def delete_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    """Deletar um dashboard"""
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    db.delete(dashboard)
    db.commit()
    return None
