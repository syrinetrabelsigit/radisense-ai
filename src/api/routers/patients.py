from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.patient import Patient
from ..schemas.patient import PatientCreate, PatientResponse


router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=List[PatientResponse])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    # Check if patient_id exists
    if db.query(Patient).filter(Patient.patient_id == patient.patient_id).first():
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    
    db_patient = Patient(
        **patient.dict(),
        radiologist_id=1  # TODO: Get from JWT token
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return db_patient


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient