from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base

class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Model info
    model_type = Column(String(50), nullable=False)  # densenet121, resnet50, etc.
    model_path = Column(String(500), nullable=True)
    
    # Dataset
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    
    # Hyperparameters
    hyperparameters = Column(JSON, nullable=True)
    
    # Results
    accuracy = Column(Float, nullable=True)
    loss = Column(Float, nullable=True)
    metrics = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(20), default='pending')  # pending, running, completed, failed
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ========== NO RELATIONSHIPS ==========