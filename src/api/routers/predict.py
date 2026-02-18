from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import torch
import time
import uuid
from datetime import datetime
from ..core.database import get_db
from ..core.config import settings
from ..models.analysis import Analysis
from ..schemas.prediction import PredictionResponse
from ..utils.model_loader import model_loader
from ..utils.preprocessing import preprocess_image
from ..utils.gradcam import generate_gradcam


router = APIRouter(prefix="/predict", tags=["predictions"])


@router.post("/", response_model=PredictionResponse)
async def predict_image(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate file
    if not file.filename.lower().endswith(tuple(settings.ALLOWED_EXTENSIONS)):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Create unique analysis ID
    analysis_id = f"ANA_{uuid.uuid4().hex[:8].upper()}"
    
    # Save uploaded image
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)
    
    image_filename = f"{analysis_id}_{file.filename}"
    image_path = upload_dir / image_filename
    
    with open(image_path, "wb") as f:
        f.write(await file.read())
    
    # Load model
    model = model_loader.get_model()
    device = model_loader.device
    
    # Preprocess
    start_time = time.time()
    image_tensor = preprocess_image(image_path).to(device)
    
    # Predict
    with torch.no_grad():
        outputs = model(image_tensor)
        predictions = torch.sigmoid(outputs).cpu().numpy()[0]
    
    processing_time = time.time() - start_time
    
    # Generate Grad-CAM
    heatmap_filename = f"{analysis_id}_heatmap.png"
    heatmap_path = upload_dir / heatmap_filename
    generate_gradcam(model, image_tensor, heatmap_path)
    
    # Create predictions dict
    predictions_dict = {
        pathology: float(predictions[i])
        for i, pathology in enumerate(settings.PATHOLOGIES)
    }
    
    confidence_score = float(predictions.max())
    
    # Save to database
    analysis = Analysis(
        analysis_id=analysis_id,
        patient_id=patient_id,
        radiologist_id=1,  # TODO: Get from JWT token
        image_path=str(image_path),
        original_filename=file.filename,
        atelectasis=float(predictions[0]),
        cardiomegaly=float(predictions[1]),
        effusion=float(predictions[2]),
        infiltration=float(predictions[3]),
        mass=float(predictions[4]),
        nodule=float(predictions[5]),
        pneumonia=float(predictions[6]),
        pneumothorax=float(predictions[7]),
        consolidation=float(predictions[8]),
        edema=float(predictions[9]),
        emphysema=float(predictions[10]),
        fibrosis=float(predictions[11]),
        pleural_thickening=float(predictions[12]),
        hernia=float(predictions[13]),
        model_used="DenseNet-121",
        model_version="1.0",
        confidence_score=confidence_score,
        processing_time=processing_time,
        heatmap_path=str(heatmap_path)
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return PredictionResponse(
        analysis_id=analysis_id,
        patient_id=patient_id,
        predictions=predictions_dict,
        confidence_score=confidence_score,
        processing_time=processing_time,
        image_url=f"/uploads/{image_filename}",
        heatmap_url=f"/uploads/{heatmap_filename}",
        model_used="DenseNet-121",
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{analysis_id}", response_model=PredictionResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    predictions_dict = {
        pathology: getattr(analysis, pathology.lower())
        for pathology in settings.PATHOLOGIES
    }
    
    return PredictionResponse(
        analysis_id=analysis.analysis_id,
        patient_id=analysis.patient_id,
        predictions=predictions_dict,
        confidence_score=analysis.confidence_score,
        processing_time=analysis.processing_time,
        image_url=f"/uploads/{Path(analysis.image_path).name}",
        heatmap_url=f"/uploads/{Path(analysis.heatmap_path).name}",
        model_used=analysis.model_used,
        timestamp=analysis.created_at.isoformat()
    )