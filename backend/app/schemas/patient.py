from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime

# ========== BASE SCHEMAS ==========

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    national_id: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    conditions: Optional[str] = None  
    emergency_contact: Optional[str] = None

# ========== CREATE SCHEMA ==========

class PatientCreate(PatientBase):
    pass  # patient_id sera généré automatiquement

# ========== UPDATE SCHEMA ==========

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    national_id: Optional[str] = None
    emergency_contact: Optional[str] = None
    # ✅ Champs médicaux manquants
    blood_type: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    conditions: Optional[str] = None

# ========== RESPONSE SCHEMAS ==========

class PatientResponse(PatientBase):
    id: int
    user_id: Optional[int] = None
    patient_id: str
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    analysis_count: int = 0
    creator_name: Optional[str] = None  # ✅ AJOUTE
    radiologist_count: Optional[int] = 0  # ✅ AJOUTE

    class Config:
        from_attributes = True

class PatientList(BaseModel):
    total: int
    patients: list[PatientResponse]

class PatientDetail(PatientResponse):
    analyses: list = []  # Liste des analyses du patient

# ========== ACCOUNT CREATION ==========

class PatientAccountCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)