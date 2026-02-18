from sqlalchemy import Column, Integer, String, Date, Enum, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class Gender(str, enum.Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "Other"


class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(Date)
    gender = Column(Enum(Gender))
    contact_phone = Column(String(20))
    contact_email = Column(String(100))
    address = Column(Text)
    medical_history = Column(Text)
    radiologist_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    radiologist = relationship("User", back_populates="patients")
    analyses = relationship("Analysis", back_populates="patient")