from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List
from ..core.database import get_db
from ..models.analysis import Analysis
from ..models.patient import Patient
from ..models.user import User
from ..core.config import settings


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict:
    """Get dashboard statistics"""
    total_analyses = db.query(func.count(Analysis.id)).scalar()
    total_patients = db.query(func.count(Patient.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    
    # Average confidence score
    avg_confidence = db.query(func.avg(Analysis.confidence_score)).scalar()
    
    # Average processing time
    avg_processing_time = db.query(func.avg(Analysis.processing_time)).scalar()
    
    return {
        "total_analyses": total_analyses or 0,
        "total_patients": total_patients or 0,
        "total_users": total_users or 0,
        "average_confidence": round(float(avg_confidence or 0), 2),
        "average_processing_time": round(float(avg_processing_time or 0), 3)
    }


@router.get("/pathologies")
def get_pathology_distribution(db: Session = Depends(get_db)) -> Dict[str, int]:
    """Get distribution of detected pathologies"""
    analyses = db.query(Analysis).all()
    
    pathology_counts = {pathology: 0 for pathology in settings.PATHOLOGIES}
    
    for analysis in analyses:
        for pathology in settings.PATHOLOGIES:
            value = getattr(analysis, pathology.lower())
            if value > 0.5:  # Threshold for positive detection
                pathology_counts[pathology] += 1
    
    return pathology_counts


@router.get("/recent")
def get_recent_analyses(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent analyses"""
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(limit).all()
    
    return [
        {
            "analysis_id": a.analysis_id,
            "patient_id": a.patient_id,
            "confidence_score": a.confidence_score,
            "created_at": a.created_at.isoformat()
        }
        for a in analyses
    ]


@router.get("/user/{user_id}")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get statistics for specific user"""
    total_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.radiologist_id == user_id
    ).scalar()
    
    avg_confidence = db.query(func.avg(Analysis.confidence_score)).filter(
        Analysis.radiologist_id == user_id
    ).scalar()
    
    return {
        "user_id": user_id,
        "total_analyses": total_analyses or 0,
        "average_confidence": round(float(avg_confidence or 0), 2)
    }