from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.experiment import Experiment
from app.models.dataset import Dataset
from app.models.analysis import Analysis
from app.schemas.researcher import (
    ExperimentCreate,
    ExperimentResponse,
    DatasetCreate,
    DatasetResponse,
)
from pydantic import BaseModel

router = APIRouter(prefix="/researcher", tags=["researcher"])


# ── helpers ────────────────────────────────────────────────────────────────────
def parse_predictions(predictions) -> list:
    if not predictions:
        return []
    if isinstance(predictions, list):
        return [str(p).strip() for p in predictions if str(p).strip() not in ('', '[', ']')]
    if isinstance(predictions, str):
        predictions = predictions.strip()
        try:
            parsed = json.loads(predictions)
            if isinstance(parsed, list):
                return [str(p).strip() for p in parsed if str(p).strip()]
            return [str(parsed).strip()] if str(parsed).strip() else []
        except (json.JSONDecodeError, ValueError):
            pass
        cleaned = predictions.strip().strip('[]')
        if not cleaned:
            return []
        parts = [p.strip().strip("'\"") for p in cleaned.split(',')]
        return [p for p in parts if p and p not in ('[', ']')]
    return []


def researcher_only(current_user: User):
    if current_user.role not in ["researcher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only researchers can access this endpoint"
        )


# ── schemas inline ─────────────────────────────────────────────────────────────
class ExperimentUpdateResults(BaseModel):
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    metrics: Optional[dict] = None
    status: Optional[str] = None
    hyperparameters: Optional[dict] = None
    description: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics/overview")
async def get_platform_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)

    total_analyses = db.query(func.count(Analysis.id)).scalar() or 0
    completed = db.query(func.count(Analysis.id)).filter(Analysis.status == 'completed').scalar() or 0
    avg_time = db.query(func.avg(Analysis.processing_time)).scalar() or 0

    # ✅ Restriction selon le plan
    plan = current_user.plan or 'free'
    if plan in ('researcher_enterprise',):
        analyses = db.query(Analysis).all()
    elif plan == 'researcher_pro':
        analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(100).all()
    else:  # free
        analyses = db.query(Analysis).order_by(Analysis.created_at.asc()).limit(5).all()

    pathology_counts = {}
    model_counts = {}
    for a in analyses:
        for p in parse_predictions(a.predictions):
            pathology_counts[p] = pathology_counts.get(p, 0) + 1
        mv = a.model_version or 'unknown'
        model_counts[mv] = model_counts.get(mv, 0) + 1

    top_pathologies = sorted(pathology_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    unique_patients = db.query(func.count(Analysis.patient_id.distinct())).scalar() or 0

    return {
        "total_analyses": total_analyses,
        "completed_analyses": completed,
        "success_rate": round((completed / total_analyses * 100) if total_analyses > 0 else 0, 2),
        "average_processing_time": round(float(avg_time), 3),
        "unique_patients_count": unique_patients,
        "top_pathologies": [{"name": n, "count": c} for n, c in top_pathologies],
        "model_distribution": [{"model": m, "count": c} for m, c in model_counts.items()],
    }


@router.get("/analytics/analyses")
async def get_all_analyses_anonymized(
    skip: int = 0,
    limit: int = 50,
    model_version: Optional[str] = None,
    pathology: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)

    # ✅ Restriction selon le plan researcher
    plan = current_user.plan or 'free'
    
    PLAN_LIMITS = {
        'free':                  {'limit': 5,   'order': 'asc'},   # 5 plus anciennes
        'researcher_free':       {'limit': 5,   'order': 'asc'},   # 5 plus anciennes
        'researcher_pro':        {'limit': 100, 'order': 'desc'},  # 100 plus récentes
        'researcher_enterprise': {'limit': None,'order': 'desc'},  # unlimited
    }
    
    plan_config = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
    
    query = db.query(Analysis)
    if model_version:
        query = query.filter(Analysis.model_version == model_version)
    if status:
        query = query.filter(Analysis.status == status)

    # ✅ Appliquer l'ordre selon le plan
    if plan_config['order'] == 'asc':
        query = query.order_by(Analysis.created_at.asc())  # plus anciennes en premier
    else:
        query = query.order_by(Analysis.created_at.desc())  # plus récentes en premier

    # ✅ Appliquer la limite selon le plan
    if plan_config['limit'] is not None:
        query = query.limit(plan_config['limit'])

    total_all = db.query(func.count(Analysis.id)).scalar() or 0
    analyses = query.all()

    results = []
    for a in analyses:
        preds = parse_predictions(a.predictions)
        if pathology and pathology.lower() not in [p.lower() for p in preds]:
            continue
        results.append({
            "id": a.id,
            "model_version": a.model_version,
            "predictions": preds,
            "confidence_scores": a.confidence_scores,
            "processing_time": a.processing_time,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "has_patient": a.patient_id is not None,
            "image_path": a.image_path if a.image_path else None,
            "heatmap_path": a.heatmap_path if a.heatmap_path else None,
        })

    return {
        "total": total_all,
        "analyses_count": len(results),
        "plan": plan,
        "plan_limit": plan_config['limit'],
        "analyses": results
    }


@router.get("/analytics/pathologies")
async def get_pathology_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)

    analyses = db.query(Analysis).filter(Analysis.status == 'completed').all()
    pathology_counts = {}
    total_detections = 0
    for a in analyses:
        for p in parse_predictions(a.predictions):
            pathology_counts[p] = pathology_counts.get(p, 0) + 1
            total_detections += 1

    distribution = sorted(pathology_counts.items(), key=lambda x: x[1], reverse=True)
    return {
        "total_analyses": len(analyses),
        "total_detections": total_detections,
        "distribution": [
            {"name": n, "count": c, "percentage": round((c / total_detections * 100) if total_detections > 0 else 0, 2)}
            for n, c in distribution
        ]
    }


@router.get("/analytics/models")
async def get_model_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)

    models = db.query(Analysis.model_version).distinct().all()
    stats = []
    for (model,) in models:
        if not model:
            continue
        total = db.query(func.count(Analysis.id)).filter(Analysis.model_version == model).scalar() or 0
        completed = db.query(func.count(Analysis.id)).filter(Analysis.model_version == model, Analysis.status == 'completed').scalar() or 0
        avg_time = db.query(func.avg(Analysis.processing_time)).filter(Analysis.model_version == model).scalar() or 0
        stats.append({
            "model": model,
            "total_analyses": total,
            "completed": completed,
            "success_rate": round((completed / total * 100) if total > 0 else 0, 2),
            "avg_processing_time": round(float(avg_time), 3),
        })

    return {"models": stats}


# ═══════════════════════════════════════════════════════════════════════════════
# DATASETS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/datasets", response_model=List[DatasetResponse])
async def get_datasets(
    skip: int = 0, limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    return db.query(Dataset).filter(Dataset.created_by == current_user.id).offset(skip).limit(limit).all()


@router.post("/datasets", response_model=DatasetResponse)
async def create_dataset(
    dataset: DatasetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    db_dataset = Dataset(
        name=dataset.name, description=dataset.description,
        type=dataset.type, size=dataset.size, created_by=current_user.id
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.created_by == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# EXPERIMENTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/experiments", response_model=List[ExperimentResponse])
async def get_experiments(
    skip: int = 0, limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    return db.query(Experiment).filter(
        Experiment.created_by == current_user.id
    ).order_by(Experiment.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/experiments", response_model=ExperimentResponse)
async def create_experiment(
    experiment: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    db_exp = Experiment(
        name=experiment.name,
        description=experiment.description,
        model_type=experiment.model_type,
        dataset_id=experiment.dataset_id,
        hyperparameters=experiment.hyperparameters,
        created_by=current_user.id,
        status='pending'
    )
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp


@router.put("/experiments/{experiment_id}/start")
async def start_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if exp.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Cannot start experiment with status '{exp.status}'")
    exp.status = 'running'
    exp.started_at = datetime.utcnow()
    db.commit()
    return {"message": "Experiment started", "experiment_id": experiment_id}


@router.put("/experiments/{experiment_id}/complete")
async def complete_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if exp.status != 'running':
        raise HTTPException(status_code=400, detail=f"Cannot complete experiment with status '{exp.status}'")
    exp.status = 'completed'
    exp.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "Experiment completed", "experiment_id": experiment_id}


@router.put("/experiments/{experiment_id}/fail")
async def fail_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    exp.status = 'failed'
    db.commit()
    return {"message": "Experiment marked as failed", "experiment_id": experiment_id}


@router.put("/experiments/{experiment_id}/results")
async def update_experiment_results(
    experiment_id: int,
    data: ExperimentUpdateResults,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update accuracy, loss, metrics, hyperparameters of an experiment."""
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if data.accuracy is not None:
        exp.accuracy = data.accuracy
    if data.loss is not None:
        exp.loss = data.loss
    if data.metrics is not None:
        exp.metrics = data.metrics
    if data.status is not None:
        allowed = ['pending', 'running', 'completed', 'failed']
        if data.status not in allowed:
            raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
        exp.status = data.status
        if data.status == 'completed' and not exp.completed_at:
            exp.completed_at = datetime.utcnow()
        if data.status == 'running' and not exp.started_at:
            exp.started_at = datetime.utcnow()
    if data.hyperparameters is not None:
        exp.hyperparameters = data.hyperparameters
    if data.description is not None:
        exp.description = data.description

    exp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/experiments/{experiment_id}")
async def delete_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    researcher_only(current_user)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id, Experiment.created_by == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    db.delete(exp)
    db.commit()
    return {"message": "Experiment deleted successfully"}