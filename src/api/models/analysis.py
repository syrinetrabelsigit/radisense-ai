from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    radiologist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    
    # 14 pathologies
    atelectasis = Column(Float, default=0.0)
    cardiomegaly = Column(Float, default=0.0)
    effusion = Column(Float, default=0.0)
    infiltration = Column(Float, default=0.0)
    mass = Column(Float, default=0.0)
    nodule = Column(Float, default=0.0)
    pneumonia = Column(Float, default=0.0)
    pneumothorax = Column(Float, default=0.0)
    consolidation = Column(Float, default=0.0)
    edema = Column(Float, default=0.0)
    emphysema = Column(Float, default=0.0)
    fibrosis = Column(Float, default=0.0)
    pleural_thickening = Column(Float, default=0.0)
    hernia = Column(Float, default=0.0)
    
    model_used = Column(String(50))
    model_version = Column(String(20))
    confidence_score = Column(Float)
    processing_time = Column(Float)
    heatmap_path = Column(String(255))
    
    is_validated = Column(Boolean, default=False)
    validated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    validated_diagnosis = Column(Text)
    medical_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relations avec foreign_keys spécifiés
    patient = relationship("Patient", back_populates="analyses")
    radiologist = relationship(
        "User",
        foreign_keys=[radiologist_id],  # ← SPÉCIFIER ICI
        back_populates="analyses"
    )
    validator = relationship(
        "User",
        foreign_keys=[validated_by]  # ← SPÉCIFIER ICI
    )