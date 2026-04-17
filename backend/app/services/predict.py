from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.analysis import Analysis
from app.schemas.prediction import (
    PredictionResponse,
    PredictionList,
    PredictionStats
)
from app.services.ml_service import MLService
from app.services.file_service import file_service
from app.services.email_service import email_service

router = APIRouter(prefix="/predict", tags=["predictions"])
ml_service = MLService()

# ========== UPLOAD & PREDICT ==========

@router.post("/upload", response_model=PredictionResponse)
async def upload_and_predict(
    file: UploadFile = File(...),
    patient_id: Optional[int] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload X-ray and get AI prediction"""
    
    # Validate file
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Check file size (max 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    # Save image
    image_path = await file_service.save_xray(file, current_user.id)
    
    # Get AI prediction
    try:
        prediction_result = await ml_service.predict(image_path)
    except Exception as e:
        # Delete uploaded file if prediction fails
        file_service.delete_file(image_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )
    
    # Create analysis record
    analysis = Analysis(
        user_id=current_user.id,
        patient_id=patient_id,
        image_path=image_path,
        predictions=prediction_result['predictions'],
        confidence_scores=prediction_result['confidence_scores'],
        heatmap_path=prediction_result.get('heatmap_path'),
        processing_time=prediction_result['processing_time'],
        notes=notes,
        status='completed'
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Send email notification if enabled
    if current_user.email_notifications:
        await email_service.send_prediction_notification(
            current_user.email,
            f"{current_user.first_name} {current_user.last_name}",
            analysis.id,
            prediction_result['predictions']
        )
    
    return analysis


# ========== GET PREDICTIONS ==========

@router.get("/", response_model=PredictionList)
async def get_predictions(
    skip: int = 0,
    limit: int = 20,
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's predictions with filters"""
    
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)
    
    if patient_id:
        query = query.filter(Analysis.patient_id == patient_id)
    
    if status:
        query = query.filter(Analysis.status == status)
    
    total = query.count()
    analyses = query.order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "predictions": analyses
    }


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single prediction by ID"""
    
    analysis = db.query(Analysis).filter(
        Analysis.id == prediction_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    return analysis


# ========== ANALYTICS ==========

@router.get("/stats/overview", response_model=PredictionStats)
async def get_prediction_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prediction statistics"""
    
    from sqlalchemy import func
    
    total = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id
    ).scalar()
    
    completed = db.query(func.count(Analysis.id)).filter(
        Analysis.user_id == current_user.id,
        Analysis.status == 'completed'
    ).scalar()
    
    avg_time = db.query(func.avg(Analysis.processing_time)).filter(
        Analysis.user_id == current_user.id
    ).scalar()
    
    # Pathology distribution
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).all()
    
    pathology_counts = {}
    for analysis in analyses:
        if analysis.predictions:
            for pathology in analysis.predictions:
                pathology_counts[pathology] = pathology_counts.get(pathology, 0) + 1
    
    return {
        "total_predictions": total or 0,
        "completed": completed or 0,
        "average_processing_time": round(avg_time, 3) if avg_time else 0,
        "pathology_distribution": pathology_counts
    }


@router.delete("/{prediction_id}")
async def delete_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prediction"""
    
    analysis = db.query(Analysis).filter(
        Analysis.id == prediction_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    # Delete files
    file_service.delete_file(analysis.image_path)
    if analysis.heatmap_path:
        file_service.delete_file(analysis.heatmap_path)
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "Prediction deleted successfully"}