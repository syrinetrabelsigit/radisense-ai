from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # ✅ NOUVEAU
    patient_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Personal info
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)
    
    # Contact
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(200), nullable=True)
    
    # Medical
    medical_history = Column(Text, nullable=True)
    national_id = Column(String(50), unique=True, nullable=True, index=True)
    blood_type = Column(String(5), nullable=True)
    height = Column(String(10), nullable=True)
    weight = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)  # ✅ NOUVEAU
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # ✅ RELATIONSHIPS
    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])
    radiologists = relationship("PatientRadiologist", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient {self.patient_id}>"


# ✅ NOUVEAU MODÈLE
class PatientRadiologist(Base):
    __tablename__ = "patient_radiologist"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    radiologist_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_primary = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # ✅ RELATIONSHIPS
    patient = relationship("Patient", back_populates="radiologists")
    radiologist = relationship("User")
    
    def __repr__(self):
        return f"<PatientRadiologist patient={self.patient_id} radiologist={self.radiologist_id}>"