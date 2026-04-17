from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ── Schemas ────────────────────────────────────────────────────────────────────
class CancelBody(BaseModel):
    reason: str


class CompleteBody(BaseModel):
    notes: Optional[str] = None


# ── Helper ─────────────────────────────────────────────────────────────────────
def format_appointment(appt: Appointment, db: Session) -> dict:
    radiologist = db.query(User).filter(User.id == appt.radiologist_id).first()
    patient     = db.query(Patient).filter(Patient.id == appt.patient_id).first()

    return {
        "id":                  appt.id,
        "date":                str(appt.appointment_date),
        "time":                str(appt.appointment_time)[:5],
        "type":                appt.appointment_type,
        "status":              appt.status,
        "notes":               appt.notes,
        "cancellation_reason": appt.cancellation_reason,
        "created_at":          appt.created_at,
        "updated_at":          appt.updated_at,
        "patient": {
            "id":         patient.id           if patient else None,
            "patient_id": patient.patient_id   if patient else None,
            "name":       f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "email":      patient.email        if patient else None,
            "phone":      patient.phone        if patient else None,
        },
        "doctor": {
            "id":         radiologist.id                                                          if radiologist else None,
            "name":       f"Dr. {radiologist.first_name} {radiologist.last_name}"                if radiologist else "Unknown",
            "specialty":  radiologist.specialty                                                   if radiologist else "Radiologist",
            "avatar_url": radiologist.avatar_url                                                  if radiologist else None,
        }
    }


def check_slot_conflict(db, radiologist_id, appointment_date, appointment_time, exclude_id=None):
    from datetime import time as dtime
    dt = datetime.combine(
        appointment_date,
        appointment_time if isinstance(appointment_time, dtime)
        else datetime.strptime(str(appointment_time)[:5], "%H:%M").time()
    )
    window_start = (dt - timedelta(minutes=29)).time()
    window_end   = (dt + timedelta(minutes=29)).time()

    query = db.query(Appointment).filter(
        Appointment.radiologist_id   == radiologist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.appointment_time >= window_start,
        Appointment.appointment_time <= window_end,
        Appointment.status.notin_(["cancelled"]),
    )
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)
    return query.first() is not None


# ═══════════════════════════════════════
# PATIENT ENDPOINTS
# ═══════════════════════════════════════

@router.get("/my-appointments")
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access this endpoint")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id
    ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()

    today = date.today()
    upcoming, past = [], []
    for appt in appointments:
        data = format_appointment(appt, db)
        if appt.appointment_date >= today and appt.status not in ("completed",):
            upcoming.append(data)
        else:
            past.append(data)

    return {"upcoming": upcoming, "past": past}


@router.post("/")
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can create appointments")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    radiologist = db.query(User).filter(
        User.id == appointment_data.radiologist_id, User.role == "radiologist"
    ).first()
    if not radiologist:
        raise HTTPException(status_code=404, detail="Radiologist not found")

    if check_slot_conflict(db, appointment_data.radiologist_id, appointment_data.appointment_date, appointment_data.appointment_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "slot_unavailable",
                "message": f"Dr. {radiologist.first_name} {radiologist.last_name} already has an appointment at this time. Please choose a different slot.",
            }
        )

    new_appointment = Appointment(
        patient_id=patient.id,
        radiologist_id=appointment_data.radiologist_id,
        appointment_date=appointment_data.appointment_date,
        appointment_time=appointment_data.appointment_time,
        appointment_type=appointment_data.appointment_type,
        notes=appointment_data.notes,
        status="pending"
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return {"message": "Appointment created successfully", "appointment_id": new_appointment.id, "status": new_appointment.status}


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can update appointments")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.patient_id == patient.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_update.dict(exclude_unset=True)
    new_date = update_data.get("appointment_date", appointment.appointment_date)
    new_time = update_data.get("appointment_time", appointment.appointment_time)

    if "appointment_date" in update_data or "appointment_time" in update_data:
        if check_slot_conflict(db, appointment.radiologist_id, new_date, new_time, exclude_id=appointment_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": "slot_unavailable", "message": "The radiologist already has an appointment at this time."}
            )

    for field, value in update_data.items():
        setattr(appointment, field, value)
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment updated successfully", "appointment_id": appointment.id}


# ── PATIENT CANCEL (after confirmation) ───────────────────────────────────────
@router.post("/{appointment_id}/cancel")
async def patient_cancel_appointment(
    appointment_id: int,
    body: CancelBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """PATIENT: Cancel with mandatory reason."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can cancel appointments")

    if not body.reason or not body.reason.strip():
        raise HTTPException(status_code=400, detail="A cancellation reason is required.")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.patient_id == patient.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment")

    appointment.status = "cancelled"
    appointment.cancellation_reason = body.reason.strip()
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment cancelled", "appointment_id": appointment.id}


# Keep old DELETE for backward compat (no reason required — for pending only)
@router.delete("/{appointment_id}")
async def cancel_appointment_delete(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """PATIENT: Cancel pending appointment (no reason needed for pending)."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can cancel appointments")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.patient_id == patient.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.status == "confirmed":
        raise HTTPException(
            status_code=400,
            detail={"error": "reason_required", "message": "This appointment is confirmed. Please provide a cancellation reason."}
        )

    appointment.status = "cancelled"
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment cancelled", "appointment_id": appointment.id}


@router.get("/radiologists")
async def get_available_radiologists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access this endpoint")

    radiologists = db.query(User).filter(User.role == "radiologist", User.is_active == True).all()
    return [{"id": r.id, "name": f"Dr. {r.first_name} {r.last_name}", "specialty": r.specialty or "Radiologist"} for r in radiologists]


@router.get("/radiologist/{radiologist_id}/booked-slots")
async def get_booked_slots(
    radiologist_id: int,
    appointment_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.radiologist_id   == radiologist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.notin_(["cancelled"]),
    ).all()
    return {"booked_slots": [str(a.appointment_time)[:5] for a in appointments]}


# ═══════════════════════════════════════
# RADIOLOGIST ENDPOINTS
# ═══════════════════════════════════════

@router.get("/radiologist/my-schedule")
async def get_radiologist_schedule(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "radiologist":
        raise HTTPException(status_code=403, detail="Only radiologists can access this endpoint")

    query = db.query(Appointment).filter(Appointment.radiologist_id == current_user.id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(
        Appointment.appointment_date.asc(), Appointment.appointment_time.asc()
    ).all()

    today = date.today()
    upcoming, past = [], []
    for appt in appointments:
        data = format_appointment(appt, db)
        if appt.appointment_date >= today and appt.status not in ("completed",):
            upcoming.append(data)
        else:
            past.append(data)

    return {
        "upcoming":        upcoming,
        "past":            past,
        "total":           len(appointments),
        "pending_count":   sum(1 for a in appointments if a.status == "pending"),
        "confirmed_count": sum(1 for a in appointments if a.status == "confirmed"),
        "today_count":     sum(1 for a in appointments if a.appointment_date == today),
    }


@router.put("/radiologist/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "radiologist":
        raise HTTPException(status_code=403, detail="Only radiologists can confirm appointments")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.radiologist_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot confirm appointment with status '{appointment.status}'")

    appointment.status = "confirmed"
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment confirmed", "appointment_id": appointment.id}


@router.put("/radiologist/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: int,
    body: CompleteBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "radiologist":
        raise HTTPException(status_code=403, detail="Only radiologists can complete appointments")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.radiologist_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "completed"
    if body.notes:
        appointment.notes = body.notes
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment marked as completed", "appointment_id": appointment.id}


# ── RADIOLOGIST CANCEL with mandatory reason ───────────────────────────────────
@router.put("/radiologist/{appointment_id}/cancel")
async def radiologist_cancel_appointment(
    appointment_id: int,
    body: CancelBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """RADIOLOGIST: Cancel with mandatory reason."""
    if current_user.role != "radiologist":
        raise HTTPException(status_code=403, detail="Only radiologists can access this endpoint")

    if not body.reason or not body.reason.strip():
        raise HTTPException(status_code=400, detail="A cancellation reason is required.")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, Appointment.radiologist_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment")

    appointment.status = "cancelled"
    appointment.cancellation_reason = body.reason.strip()
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Appointment cancelled", "appointment_id": appointment.id}
@router.delete("/radiologist/{appointment_id}")
async def radiologist_delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """RADIOLOGIST: Remove cancelled appointment from view."""
    if current_user.role != "radiologist":
        raise HTTPException(status_code=403, detail="Only radiologists can access this endpoint")

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.radiologist_id == current_user.id,
        Appointment.status == "cancelled"
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Cancelled appointment not found")

    db.delete(appointment)
    db.commit()
    return {"message": "Appointment removed"}

# ═══════════════════════════════════════
# ADMIN ENDPOINTS
# ═══════════════════════════════════════

@router.get("/admin/all")
async def admin_get_all_appointments(
    status_filter: Optional[str] = None,
    radiologist_id: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    query = db.query(Appointment)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if radiologist_id:
        query = query.filter(Appointment.radiologist_id == radiologist_id)

    total = query.count()
    appointments = query.order_by(
        Appointment.appointment_date.desc(), Appointment.appointment_time.desc()
    ).offset(skip).limit(limit).all()

    return {"total": total, "appointments": [format_appointment(a, db) for a in appointments]}


@router.get("/admin/stats")
async def admin_get_appointment_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    today = date.today()
    return {
        "total":     db.query(func.count(Appointment.id)).scalar(),
        "pending":   db.query(func.count(Appointment.id)).filter(Appointment.status == "pending").scalar(),
        "confirmed": db.query(func.count(Appointment.id)).filter(Appointment.status == "confirmed").scalar(),
        "completed": db.query(func.count(Appointment.id)).filter(Appointment.status == "completed").scalar(),
        "cancelled": db.query(func.count(Appointment.id)).filter(Appointment.status == "cancelled").scalar(),
        "today":     db.query(func.count(Appointment.id)).filter(Appointment.appointment_date == today).scalar(),
    }


@router.put("/admin/{appointment_id}/status")
async def admin_update_appointment_status(
    appointment_id: int, new_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = new_status
    appointment.updated_at = datetime.utcnow()
    db.commit()

    return {"message": f"Status updated to '{new_status}'", "appointment_id": appointment.id}


@router.delete("/admin/{appointment_id}")
async def admin_delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(appointment)
    db.commit()

    return {"message": "Appointment deleted successfully"}