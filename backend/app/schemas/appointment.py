from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional

class AppointmentBase(BaseModel):
    appointment_date: date
    appointment_time: time
    appointment_type: str
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    radiologist_id: int

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    appointment_type: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    patient_id: int
    radiologist_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for frontend
    cancellation_reason: Optional[str] = None
    radiologist_name: Optional[str] = None
    radiologist_specialty: Optional[str] = None
    radiologist_image: Optional[str] = None
    
    class Config:
        from_attributes = True