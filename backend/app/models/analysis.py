from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    
    # Image data
    image_path = Column(String(500), nullable=False)
    heatmap_path = Column(String(500), nullable=True)
    
    # Predictions
    predictions = Column(JSON, nullable=True)  # List of detected pathologies
    confidence_scores = Column(JSON, nullable=True)  # Dict of pathology: confidence
    
    # Metadata
    processing_time = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default='pending')  # pending, processing, completed, failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ========== RELATIONSHIPS - SUPPRIMÉS POUR L'INSTANT ==========
    
    def __repr__(self):
        return f"<Analysis {self.id} - User {self.user_id}>"