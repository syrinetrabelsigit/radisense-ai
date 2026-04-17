from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.analysis import Analysis
from app.models.patient import Patient
from app.schemas.prediction import PredictionResponse
from app.services.ml_service import MLService
from app.services.file_service import file_service
from app.services.plan_middleware import check_plan_quota  # ← NOUVEAU

router = APIRouter(prefix="/predict", tags=["predictions"])
ml_service = MLService()


# ========== PREDICT IMAGE ==========

@router.post("/", response_model=PredictionResponse)
async def predict_image(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    model_name: str = Form('mobilenet'),
    pending_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload X-ray image and get AI prediction"""

    # ── NOUVEAU: Check monthly quota ─────────────────────────────────────────
    quota = check_plan_quota(current_user, db)
    # quota contains: plan, used, limit, remaining, unlimited
    # ─────────────────────────────────────────────────────────────────────────

    # Validate model name
    valid_models = ['mobilenet', 'densenet', 'resnet', 'efficientnet']
    if model_name not in valid_models:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid model. Choose from: {valid_models}"
        )

    # Validate patient exists (if provided)
    if patient_id:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

    # Validate file extension
    if not file.filename.lower().endswith(tuple(settings.ALLOWED_EXTENSIONS)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )

    # Save image
    try:
        image_path = await file_service.save_xray(file, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )

    # Get AI prediction with selected model
    try:
        prediction_result = await ml_service.predict(image_path, model_name)
    except Exception as e:
        file_service.delete_file(image_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

    # ✅ Si pending_id → mettre à jour le pending au lieu d'en créer un nouveau
    if pending_id:
        pending = db.query(Analysis).filter(
            Analysis.id == pending_id,
            Analysis.user_id == current_user.id
        ).first()
        if pending:
            pending.status = 'completed'
            pending.predictions = prediction_result.get('predictions', [])
            pending.confidence_scores = prediction_result['confidence_scores']
            pending.model_version = model_name
            pending.processing_time = prediction_result['processing_time']
            pending.image_path = image_path
            pending.notes = None  # ✅ Notes vides — médecin les ajoutera après
            db.commit()
            db.refresh(pending)
            return pending  # ✅ Retourner le pending mis à jour

    # Créer une nouvelle analyse seulement si pas de pending
    analysis = Analysis(
        user_id=current_user.id,
        patient_id=patient_id,
        image_path=image_path,
        predictions=prediction_result.get('predictions', []),
        confidence_scores=prediction_result['confidence_scores'],
        heatmap_path=None,
        processing_time=prediction_result['processing_time'],
        notes=None,  # ✅ Notes vides — médecin les ajoutera après
        status='completed',
        model_version=model_name
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


# ========== GET QUOTA INFO ==========

@router.get("/quota")
async def get_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's monthly quota status"""
    from app.services.plan_middleware import get_user_plan, get_monthly_analysis_count, PLAN_LIMITS

    plan  = get_user_plan(current_user, db)
    limit = PLAN_LIMITS.get(plan, 10)
    used  = get_monthly_analysis_count(current_user.id, db)

    return {
        "plan":      plan,
        "used":      used,
        "limit":     limit,
        "remaining": None if limit is None else max(0, limit - used),
        "unlimited": limit is None,
        "percentage": None if limit is None else round((used / limit) * 100, 1),
    }
# ========== GET ALL ANALYSES (LIST) ==========

@router.get("/")
async def get_analyses(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all analyses for current user"""
    from sqlalchemy import desc

    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    if status:
        query = query.filter(Analysis.status == status)

    total = query.count()
    analyses = query.order_by(desc(Analysis.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "analyses": [
            {
                "id":               a.id,
                "user_id":          a.user_id,
                "patient_id":       a.patient_id,
                "image_path":       a.image_path,
                "heatmap_path":     a.heatmap_path,
                "predictions":      a.predictions or [],
                "confidence_scores":a.confidence_scores or {},
                "processing_time":  a.processing_time,
                "model_version":    a.model_version,
                "notes":            a.notes,
                "status":           a.status,
                "created_at":       a.created_at.isoformat() if a.created_at else None,
            }
            for a in analyses
        ]
    }
# ========== GET ANALYSES BY PATIENT (pour le patient connecté) ==========

@router.get("/my-patient-analyses")
async def get_my_patient_analyses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all analyses where the current user is the patient"""
    from sqlalchemy import desc
    from app.models.patient import Patient

    # Trouver le patient lié à ce user
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        return {"total": 0, "analyses": []}

    total = db.query(Analysis).filter(Analysis.patient_id == patient.id).count()
    analyses = db.query(Analysis).filter(
        Analysis.patient_id == patient.id
    ).order_by(desc(Analysis.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "analyses": [
            {
                "id":                a.id,
                "user_id":           a.user_id,
                "patient_id":        a.patient_id,
                "image_path":        a.image_path,
                "heatmap_path":      a.heatmap_path,
                "predictions":       a.predictions or [],
                "confidence_scores": a.confidence_scores or {},
                "processing_time":   a.processing_time,
                "model_version":     a.model_version,
                "notes":             a.notes,
                "status":            a.status,
                "created_at":        a.created_at.isoformat() if a.created_at else None,
            }
            for a in analyses
        ]
    }

# ========== PATIENT SUBMIT XRAY TO RADIOLOGIST ==========

@router.post("/submit-to-radiologist")
async def submit_xray_to_radiologist(
    file: UploadFile = File(...),
    radiologist_id: int = Form(...),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Patient submits an X-ray to a specific radiologist for analysis"""
    from app.models.patient import Patient

    # Vérifier que c'est bien un patient
    if current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can submit X-rays")

    # Trouver le patient lié
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Vérifier que le radiologue existe
    radiologist = db.query(User).filter(
        User.id == radiologist_id,
        User.role == 'radiologist'
    ).first()
    if not radiologist:
        raise HTTPException(status_code=404, detail="Radiologist not found")

    # Valider le fichier
    if not file.filename.lower().endswith(tuple(settings.ALLOWED_EXTENSIONS)):
        raise HTTPException(status_code=400, detail=f"File type not allowed")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    # Sauvegarder l'image
    try:
        image_path = await file_service.save_xray(file, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

    # Créer l'analyse avec status 'pending' — le radiologue doit l'analyser
    analysis = Analysis(
        user_id=radiologist_id,
        patient_id=patient.id,
        image_path=image_path,
        predictions=[],
        confidence_scores={},
        heatmap_path=None,
        processing_time=0,
        notes=notes or f"Submitted by patient {patient.first_name} {patient.last_name}",
        status='pending',
        model_version=None
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "id": analysis.id,
        "message": "X-ray submitted successfully. Your radiologist will analyze it soon.",
        "radiologist": radiologist.first_name + " " + radiologist.last_name,
        "status": "pending"
    }

# ========== GET PENDING XRAYS FROM PATIENTS (pour radiologue) ==========

@router.get("/pending-from-patients")
async def get_pending_from_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending analyses submitted by patients to this radiologist"""
    from sqlalchemy import desc

    if current_user.role not in ['radiologist', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")

    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.status == 'pending'
    ).order_by(desc(Analysis.created_at)).all()

    result = []
    for a in analyses:
        patient_info = None
        if a.patient_id:
            patient = db.query(Patient).filter(Patient.id == a.patient_id).first()
            if patient:
                patient_info = {
                    "id": patient.id,
                    "patient_id": patient.patient_id,
                    "first_name": patient.first_name,
                    "last_name": patient.last_name,
                    "date_of_birth": str(patient.date_of_birth) if patient.date_of_birth else None,
                }
        result.append({
            "id":           a.id,
            "image_path":   a.image_path,
            "notes":        a.notes,
            "status":       a.status,
            "created_at":   a.created_at.isoformat() if a.created_at else None,
            "patient":      patient_info,
        })

    return {"total": len(result), "analyses": result}

# ========== IMAGE PROXY ==========
@router.get("/image-proxy")
async def image_proxy(
    path: str,
    current_user: User = Depends(get_current_user)
):
    """Proxy pour servir les images locales avec CORS"""
    from fastapi.responses import FileResponse
    import os

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(path, media_type="image/png")

# ========== UPDATE NOTES (radiologue → patient) ==========

@router.put("/{analysis_id}/notes")
async def update_analysis_notes(
    analysis_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Radiologue met à jour les notes destinées au patient"""
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.notes = data.get("notes", "")
    db.commit()
    db.refresh(analysis)

    return {"message": "Notes updated successfully", "notes": analysis.notes}

# ========== GET ANALYSIS ==========

@router.get("/{analysis_id}", response_model=PredictionResponse)
async def get_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis by ID — accessible by radiologist (owner) or patient (linked)"""

    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Radiologue propriétaire
    if analysis.user_id == current_user.id:
        return analysis

    # Patient lié à cette analyse
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if patient and analysis.patient_id == patient.id:
        return analysis

    # Admin
    if current_user.role == 'admin':
        return analysis

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Analysis not found"
    )
