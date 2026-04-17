from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import datetime, timedelta
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.analysis import Analysis
from app.schemas.prediction import PredictionStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ========== HELPER: parse predictions safely ==========

def parse_predictions(predictions) -> list:
    """
    Handles all storage formats:
      - None / empty
      - Proper Python list (JSON column working correctly)
      - JSON string: '["Effusion", "Pneumonia"]'
      - Dirty string: '[Effusion, Pneumonia]'  (no quotes)
      - Single string: 'Effusion'
    Returns a clean list of non-empty strings, no '[' or ']' chars.
    """
    if not predictions:
        return []

    # Already a proper list
    if isinstance(predictions, list):
        result = []
        for p in predictions:
            p = str(p).strip()
            if p and p not in ('[', ']'):
                result.append(p)
        return result

    # It's a string — try JSON parse first
    if isinstance(predictions, str):
        predictions = predictions.strip()
        try:
            parsed = json.loads(predictions)
            if isinstance(parsed, list):
                return [str(p).strip() for p in parsed if str(p).strip() not in ('', '[', ']')]
            return [str(parsed).strip()] if str(parsed).strip() else []
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: strip brackets and split by comma
        cleaned = predictions.strip().strip('[]')
        if not cleaned:
            return []
        parts = [p.strip().strip("'\"") for p in cleaned.split(',')]
        return [p for p in parts if p and p not in ('[', ']')]

    return []


# ========== DASHBOARD STATS ==========

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics"""

    # Total predictions
    total_predictions = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id
    ).scalar() or 0

    # This month predictions
    now = datetime.utcnow()
    first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    month_predictions = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= first_day_month
    ).scalar() or 0

    # Average processing time
    avg_time = db.query(func.avg(Analysis.processing_time)).filter(
        Analysis.user_id == current_user.id
    ).scalar() or 0

    # Success rate
    completed = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id,
        Analysis.status == 'completed'
    ).scalar() or 0

    success_rate = (completed / total_predictions * 100) if total_predictions > 0 else 0

    # Recent predictions
    recent = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(5).all()

    # Most common pathologies — using helper
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).all()

    pathology_counts = {}
    for analysis in analyses:
        for pathology in parse_predictions(analysis.predictions):
            pathology_counts[pathology] = pathology_counts.get(pathology, 0) + 1

    top_pathologies = sorted(
        pathology_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]

    return {
        "total_predictions": total_predictions,
        "month_predictions": month_predictions,
        "average_processing_time": round(avg_time, 3),
        "success_rate": round(success_rate, 2),
        "recent_predictions": [
            {
                "id": a.id,
                "created_at": a.created_at.isoformat(),
                "predictions": parse_predictions(a.predictions),
                "status": a.status
            } for a in recent
        ],
        "top_pathologies": [
            {"name": name, "count": count}
            for name, count in top_pathologies
        ],
        "total_patients": db.query(func.count(Analysis.patient_id.distinct())).filter(
            Analysis.user_id == current_user.id
        ).scalar() or 0
    }


# ========== PERFORMANCE METRICS ==========

@router.get("/performance")
async def get_performance_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics over time"""

    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(Analysis.created_at >= start)

    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.filter(Analysis.created_at <= end)

    analyses = query.all()

    total = len(analyses)
    completed = sum(1 for a in analyses if a.status == 'completed')
    failed = sum(1 for a in analyses if a.status == 'failed')
    avg_time = sum(a.processing_time for a in analyses if a.processing_time) / total if total > 0 else 0

    return {
        "total_analyses": total,
        "completed": completed,
        "failed": failed,
        "success_rate": round((completed / total * 100) if total > 0 else 0, 2),
        "average_processing_time": round(avg_time, 3),
        "period": {
            "start": start_date,
            "end": end_date
        }
    }


# ========== PATHOLOGY DISTRIBUTION ==========

@router.get("/pathology-distribution")
async def get_pathology_distribution(
    period: Optional[str] = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pathology distribution for specified period"""

    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    now = datetime.utcnow()
    if period == "day":
        query = query.filter(Analysis.created_at >= now - timedelta(days=1))
    elif period == "week":
        query = query.filter(Analysis.created_at >= now - timedelta(weeks=1))
    elif period == "month":
        query = query.filter(Analysis.created_at >= now - timedelta(days=30))
    elif period == "7days":
        query = query.filter(Analysis.created_at >= now - timedelta(days=7))
    elif period == "30days":
        query = query.filter(Analysis.created_at >= now - timedelta(days=30))
    elif period == "3months":
        query = query.filter(Analysis.created_at >= now - timedelta(days=90))
    elif period == "year":
        query = query.filter(Analysis.created_at >= now - timedelta(days=365))

    analyses = query.all()

    pathology_counts = {}
    total_detections = 0

    for analysis in analyses:
        for pathology in parse_predictions(analysis.predictions):
            pathology_counts[pathology] = pathology_counts.get(pathology, 0) + 1
            total_detections += 1

    distribution = [
        {
            "name": name,
            "count": count,
            "percentage": round((count / total_detections * 100) if total_detections > 0 else 0, 2)
        }
        for name, count in sorted(pathology_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "period": period,
        "total_detections": total_detections,
        "total_analyses": len(analyses),
        "distribution": distribution
    }


# ========== TIME SERIES DATA ==========

@router.get("/time-series")
async def get_time_series(
    interval: str = "day",
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get time series data for charts"""

    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(limit * 10).all()

    data_points = {}

    for analysis in analyses:
        if interval == "day":
            key = analysis.created_at.strftime('%Y-%m-%d')
        elif interval == "week":
            key = analysis.created_at.strftime('%Y-W%W')
        else:
            key = analysis.created_at.strftime('%Y-%m')

        if key not in data_points:
            data_points[key] = {"date": key, "count": 0, "completed": 0, "failed": 0}

        data_points[key]["count"] += 1
        if analysis.status == "completed":
            data_points[key]["completed"] += 1
        elif analysis.status == "failed":
            data_points[key]["failed"] += 1

    sorted_data = sorted(data_points.values(), key=lambda x: x["date"], reverse=True)[:limit]
    sorted_data.reverse()

    return {"interval": interval, "data": sorted_data}


# ========== EXPORT REPORT ==========

@router.get("/export/{format}")
async def export_report(
    format: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics report in specified format"""

    if format not in ["json", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format must be 'json' or 'csv'"
        )

    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    if start_date:
        query = query.filter(Analysis.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Analysis.created_at <= datetime.fromisoformat(end_date))

    analyses = query.all()

    data = []
    for analysis in analyses:
        preds = parse_predictions(analysis.predictions)
        data.append({
            "id": analysis.id,
            "date": analysis.created_at.isoformat(),
            "predictions": ", ".join(preds),
            "status": analysis.status,
            "processing_time": analysis.processing_time
        })

    if format == "json":
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=report_{datetime.utcnow().strftime('%Y%m%d')}.json"}
        )

    else:
        import csv
        import io

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "date", "predictions", "status", "processing_time"])
        writer.writeheader()
        writer.writerows(data)

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )


# ========== COMPARISON ==========

@router.get("/compare")
async def compare_periods(
    period1_start: str,
    period1_end: str,
    period2_start: str,
    period2_end: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two time periods"""

    p1_analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= datetime.fromisoformat(period1_start),
        Analysis.created_at <= datetime.fromisoformat(period1_end)
    ).all()

    p2_analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= datetime.fromisoformat(period2_start),
        Analysis.created_at <= datetime.fromisoformat(period2_end)
    ).all()

    def calculate_stats(analyses):
        total = len(analyses)
        completed = sum(1 for a in analyses if a.status == 'completed')
        avg_time = sum(a.processing_time for a in analyses if a.processing_time) / total if total > 0 else 0
        return {
            "total": total,
            "completed": completed,
            "success_rate": round((completed / total * 100) if total > 0 else 0, 2),
            "avg_processing_time": round(avg_time, 3)
        }

    return {
        "period1": {
            "start": period1_start,
            "end": period1_end,
            "stats": calculate_stats(p1_analyses)
        },
        "period2": {
            "start": period2_start,
            "end": period2_end,
            "stats": calculate_stats(p2_analyses)
        }
    }


# ========== MODEL STATISTICS ==========

@router.get("/models/stats")
async def get_model_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics per model"""
    
    # Total analyses
    total_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id
    ).scalar() or 0
    
    # Stats par modèle
    models = ['mobilenet', 'densenet', 'resnet', 'efficientnet']
    model_stats = []
    
    for model in models:
        count = db.query(func.count(Analysis.id)).filter(
            Analysis.user_id == current_user.id,
            Analysis.model_version == model
        ).scalar() or 0
        
        # Temps moyen pour ce modèle
        avg_time = db.query(func.avg(Analysis.processing_time)).filter(
            Analysis.user_id == current_user.id,
            Analysis.model_version == model
        ).scalar() or 0
        
        model_stats.append({
            "model": model,
            "count": count,
            "avg_processing_time": round(avg_time, 2)
        })
    
    return {
        "total_analyses": total_analyses,
        "models": model_stats
    }