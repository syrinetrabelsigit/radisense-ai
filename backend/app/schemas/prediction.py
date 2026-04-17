from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

# ========== PREDICTION BASE ==========

class PredictionBase(BaseModel):
    patient_id: Optional[int] = None
    notes: Optional[str] = None


# ========== PREDICTION RESPONSE ==========

class PredictionResponse(BaseModel):
    id: int
    user_id: int
    patient_id: Optional[int] = None
    image_path: str
    predictions: List[str]
    confidence_scores: Dict[str, float]
    heatmap_path: Optional[str] = None
    processing_time: float
    model_version: str  # ✅ AJOUTÉ
    notes: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== PREDICTION LIST ==========

class PredictionList(BaseModel):
    total: int
    predictions: List[PredictionResponse]


# ========== PREDICTION STATS ==========

class PredictionStats(BaseModel):
    total_predictions: int
    completed: int
    average_processing_time: float
    pathology_distribution: Dict[str, int]