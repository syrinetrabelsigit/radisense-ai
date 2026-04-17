from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.user import User
from app.models.patient import Patient
from app.models.analysis import Analysis

router = APIRouter(prefix="/admin", tags=["admin"])

def check_admin(current_user: User):
    """Check if user is admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

# ========== USER MANAGEMENT ==========

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (Admin only)"""
    check_admin(current_user)
    
    query = db.query(User)
    
    if role and role != 'all':
        query = query.filter(User.role == role)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter))
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    # ✅ FIX: Utilise user_id au lieu de radiologist_id
    users_data = []
    for u in users:
        analyses_count = 0
        if u.role == "radiologist":
            # ✅ Pour radiologist: compter les analyses créées (user_id)
            analyses_count = db.query(func.count(Analysis.id)).filter(
                Analysis.user_id == u.id
            ).scalar()
        elif u.role == "patient":
            # ✅ Pour patient: compter via patient_id
            patient = db.query(Patient).filter(Patient.user_id == u.id).first()
            if patient:
                analyses_count = db.query(func.count(Analysis.id)).filter(
                    Analysis.patient_id == patient.id
                ).scalar()
        
        users_data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "analyses_count": analyses_count
        })
    
    return {
        "total": total,
        "users": users_data
    }


@router.post("/users")
async def create_user(
    username: str,
    email: str,
    first_name: str,
    last_name: str,
    password: str,
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    check_admin(current_user)
    
    # Vérifier que le username n'existe pas
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Vérifier que l'email n'existe pas
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Valider le rôle
    valid_roles = ["admin", "radiologist", "patient", "researcher"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Créer l'utilisateur
    new_user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
        email_verified=True,
        must_change_password=True,
        # ✅ Plan par défaut selon le rôle
        plan='free' if role in ('radiologist', 'researcher') else None,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ Si patient → créer automatiquement le profil Patient
    if role == 'patient':
        import secrets
        patient_count = db.query(Patient).count()
        auto_patient_id = f"PAT{str(patient_count + 1).zfill(3)}"
        
        new_patient = Patient(
            patient_id=auto_patient_id,
            user_id=new_user.id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            created_by=current_user.id,
        )
        db.add(new_patient)
        db.commit()

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role,
            "plan": new_user.plan,
            "is_active": new_user.is_active
        }
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    username: Optional[str] = None,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)"""
    check_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Mettre à jour les champs si fournis
    if username is not None:
        # Vérifier unicité
        existing = db.query(User).filter(
            User.username == username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        user.username = username
    
    if email is not None:
        # Vérifier unicité
        existing = db.query(User).filter(
            User.email == email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        user.email = email
    
    if first_name is not None:
        user.first_name = first_name
    
    if last_name is not None:
        user.last_name = last_name
    
    if role is not None:
        valid_roles = ["admin", "radiologist", "patient", "researcher"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        user.role = role
    
    if is_active is not None:
        user.is_active = is_active
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate/deactivate user"""
    check_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'}",
        "user_id": user_id,
        "is_active": user.is_active
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user permanently"""
    check_admin(current_user)
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


# ========== SYSTEM MONITORING ==========

@router.get("/system/stats")
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system-wide statistics"""
    check_admin(current_user)
    
    # User stats
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    users_by_role = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    
    # Analysis stats
    total_analyses = db.query(func.count(Analysis.id)).scalar()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.created_at >= today_start
    ).scalar()
    
    # Average processing time
    avg_time = db.query(func.avg(Analysis.processing_time)).scalar()
    
    # Patient stats
    total_patients = db.query(func.count(Patient.id)).scalar()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users,
            "by_role": {role: count for role, count in users_by_role}
        },
        "analyses": {
            "total": total_analyses,
            "today": today_analyses,
            "average_processing_time": round(avg_time, 3) if avg_time else 0
        },
        "patients": {
            "total": total_patients
        }
    }


@router.get("/system/health")
async def system_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check system health"""
    check_admin(current_user)
    
    # Check database connection
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Check recent errors
    failed_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.status == 'failed',
        Analysis.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).scalar()
    
    return {
        "status": "healthy" if db_status == "healthy" and failed_analyses < 10 else "degraded",
        "database": db_status,
        "failed_analyses_24h": failed_analyses,
        "timestamp": datetime.utcnow().isoformat()
    }


# ========== AUDIT LOGS ==========

@router.get("/audit-logs")
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs"""
    check_admin(current_user)
    
    # For now, return recent analyses as proxy
    query = db.query(Analysis)
    
    if user_id:
        query = query.filter(Analysis.user_id == user_id)
    
    logs = query.order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else f"User #{log.user_id}",
            "action": "prediction",
            "timestamp": log.created_at.isoformat(),
            "status": log.status
        })

    return {
        "total": query.count(),
        "logs": result
    }