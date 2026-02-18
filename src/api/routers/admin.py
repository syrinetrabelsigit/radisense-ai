from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from ..core.database import get_db
from ..models.user import User
from ..models.analysis import Analysis


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/system/health")
def system_health(db: Session = Depends(get_db)) -> Dict:
    """Check system health"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "api": "healthy"
    }


@router.get("/models/active")
def get_active_model():
    """Get currently active model"""
    from ..core.config import settings
    return {
        "model_name": "DenseNet-121",
        "model_path": settings.DEFAULT_MODEL,
        "version": "1.0"
    }


@router.get("/logs")
def get_system_logs(limit: int = 100):
    """Get system logs (placeholder)"""
    return {
        "logs": [],
        "message": "Logging system not yet implemented"
    }