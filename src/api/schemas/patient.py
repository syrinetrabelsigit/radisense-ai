from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from ..models.patient import Gender


class PatientBase(BaseModel):
    patient_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    radiologist_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True