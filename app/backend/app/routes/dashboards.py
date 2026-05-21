from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard
from app.schemas.dashboard_schema import DashboardCreate, DashboardResponse, DashboardUpdate
from typing import List

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])


@router.get("", response_model=List[DashboardResponse])
def list_dashboards(db: Session = Depends(get_db)):
    dashboards = db.query(Dashboard).all()
    return dashboards


@router.get("/{dashboard_id}", response_model=DashboardResponse)
def get_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard


@router.post("", response_model=DashboardResponse)
def create_dashboard(dashboard_data: DashboardCreate, db: Session = Depends(get_db)):
    dashboard = Dashboard(
        name=dashboard_data.name,
        description=dashboard_data.description,
        config=dashboard_data.config,
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: str, dashboard_data: DashboardUpdate, db: Session = Depends(get_db)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard_data.name:
        dashboard.name = dashboard_data.name
    if dashboard_data.description is not None:
        dashboard.description = dashboard_data.description
    if dashboard_data.config:
        dashboard.config = dashboard_data.config

    db.commit()
    db.refresh(dashboard)
    return dashboard


@router.delete("/{dashboard_id}")
def delete_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    db.delete(dashboard)
    db.commit()
    return {"message": "Dashboard deleted successfully"}
