from pydantic import BaseModel
from typing import Dict, Optional


class PredictionRequest(BaseModel):
    patient_id: int


class PredictionResponse(BaseModel):
    analysis_id: str
    patient_id: int
    predictions: Dict[str, float]
    confidence_score: float
    processing_time: float
    image_url: str
    heatmap_url: str
    model_used: str
    timestamp: str
    
    class Config:
        from_attributes = True