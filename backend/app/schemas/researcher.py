from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime

# ========== DATASET SCHEMAS ==========

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = Field(..., pattern="^(training|validation|test)$")  
    size: Optional[int] = None


class DatasetCreate(DatasetBase):
    pass


class DatasetResponse(DatasetBase):
    id: int
    path: Optional[str] = None
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ========== EXPERIMENT SCHEMAS ==========

class ExperimentBase(BaseModel):
    name: str
    description: Optional[str] = None
    model_type: str
    dataset_id: Optional[int] = None
    hyperparameters: Optional[Dict] = None


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ExperimentResponse(ExperimentBase):
    id: int
    model_path: Optional[str] = None
    accuracy: Optional[float] = None
    loss: Optional[float] = None
    metrics: Optional[Dict] = None
    status: str
    created_by: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ExperimentStats(BaseModel):
    total_experiments: int
    running: int
    completed: int
    failed: int
    average_accuracy: float


# ========== MODEL COMPARISON ==========

class ModelComparison(BaseModel):
    model_id: int
    model_name: str
    model_type: str
    accuracy: float
    loss: float
    metrics: Dict


# ========== PUBLICATION SCHEMAS ==========

class PublicationBase(BaseModel):
    title: str
    authors: List[str]
    journal: Optional[str] = None
    year: int
    doi: Optional[str] = None
    abstract: Optional[str] = None


class PublicationCreate(PublicationBase):
    pass


class PublicationResponse(PublicationBase):
    id: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True