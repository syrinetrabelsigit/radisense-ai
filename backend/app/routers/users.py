import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, verify_password
from app.core.config import settings
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    NotificationSettings
)

router = APIRouter(prefix="/users", tags=["users"])

# ── Configure Cloudinary ───────────────────────────────────────────────────────
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Partners (no auth required)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/partners")
async def get_partners(db: Session = Depends(get_db)):
    """
    Public endpoint — returns active verified radiologists for the Partners page.
    Only exposes public professional info, no sensitive data.
    """
    radiologists = db.query(User).filter(
        User.role == "radiologist",
        User.is_active == True,
        User.deleted_at == None,
        User.must_change_password == False,  # Already activated their account
        User.plan.in_(["pro", "enterprise"]),  # Seulement abonnés payants
    ).order_by(User.created_at.asc()).all()

    result = []
    for r in radiologists:
        # Count analyses — import here to avoid circular imports
        try:
            from app.models.analysis import Analysis
            analyses_count = db.query(Analysis).filter(
                Analysis.user_id == r.id
            ).count()
        except Exception:
            analyses_count = 0

        result.append({
            "id":               r.id,
            "name":             f"Dr. {r.first_name} {r.last_name}",
            "first_name":       r.first_name,
            "last_name":        r.last_name,
            "avatar_url":       r.avatar_url,
            "specialty":        r.specialty or "General Radiology",
            "license_number":   r.license_number,
            "cabinet_name":     r.cabinet_name,
            "cabinet_address":  r.cabinet_address,
            "cabinet_phone":    r.cabinet_phone,
            "city":             r.city,
            "region":           r.region,
            "country":          r.country,
            "years_experience": r.years_experience,
            "plan":             r.plan or "free",
            "analyses_count":   analyses_count,
            "member_since":     r.created_at.year if r.created_at else None,
        })

    return {
        "total": len(result),
        "partners": result
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — List all users (for messaging)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "radiologist"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    users = db.query(User).filter(
        User.id != current_user.id,
        User.is_active == True,
        User.deleted_at == None
    ).offset(skip).limit(limit).all()

    return {
        "users": [
            {
                "id":         u.id,
                "first_name": u.first_name,
                "last_name":  u.last_name,
                "role":       u.role.value if hasattr(u.role, "value") else str(u.role),
                "email":      u.email,
                "avatar_url": u.avatar_url,
            }
            for u in users
        ],
        "total": len(users)
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Common fields
    for field in ["first_name", "last_name", "phone", "bio", "city", "country", "years_experience"]:
        val = getattr(user_update, field)
        if val is not None:
            setattr(current_user, field, val)

    # Radiologist fields
    if current_user.role == "radiologist":
        for field in ["specialty", "license_number", "cabinet_name", "cabinet_address", "cabinet_phone", "region"]:
            val = getattr(user_update, field)
            if val is not None:
                setattr(current_user, field, val)

    # Researcher fields
    elif current_user.role == "researcher":
        for field in ["institution", "orcid"]:
            val = getattr(user_update, field)
            if val is not None:
                setattr(current_user, field, val)

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


# ═══════════════════════════════════════════════════════════════════════════════
# AVATAR UPLOAD — Cloudinary
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload avatar to Cloudinary — required for radiologists, optional for others."""

    # Validate type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPG, PNG, WebP)"
        )

    # Validate size (5MB max)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    try:
        # Delete old avatar from Cloudinary if exists
        if current_user.avatar_url and "cloudinary" in current_user.avatar_url:
            try:
                # Extract public_id from URL
                parts = current_user.avatar_url.split("/")
                public_id = "/".join(parts[-2:]).split(".")[0]
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass  # Don't fail if old image can't be deleted

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="radisense/avatars",
            public_id=f"user_{current_user.id}",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )

        avatar_url = upload_result["secure_url"]

        # Save URL to DB
        current_user.avatar_url = avatar_url
        current_user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url
        }

    except cloudinary.exceptions.Error as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# ACCOUNT SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/settings/notifications")
async def update_notification_settings(
    notif_settings: NotificationSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.email_notifications = notif_settings.email_notifications
    current_user.sms_notifications = notif_settings.sms_notifications
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {
        "message": "Notification settings updated",
        "email_notifications": current_user.email_notifications,
        "sms_notifications": current_user.sms_notifications
    }

@router.post("/verify-password")
async def verify_password_endpoint(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify current password without changing it"""
    password = data.get("password", "")
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    return {"valid": True}

@router.post("/settings/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password changed successfully"}


@router.put("/settings/2fa")
async def toggle_two_factor(
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.two_factor_enabled = enabled
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {
        "message": f"2FA {'enabled' if enabled else 'disabled'}",
        "two_factor_enabled": current_user.two_factor_enabled
    }


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.is_active = False
    current_user.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Account deleted successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}/public")
async def get_user_public(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":         user.id,
        "first_name": user.first_name,
        "last_name":  user.last_name,
        "role":       user.role,
        "avatar_url": user.avatar_url,
    }


class ChangeCredentialsRequest(BaseModel):
    new_username: Optional[str] = None
    new_password: str


@router.post("/change-credentials")
async def change_credentials(
    data: ChangeCredentialsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.new_username and data.new_username != current_user.username:
        existing = db.query(User).filter(User.username == data.new_username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.new_username

    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.must_change_password = False
    db.commit()

    # ✅ Générer un nouveau token avec le nouveau username
    from app.core.security import create_access_token
    new_token = create_access_token(data={"sub": current_user.username})

    return {
        "message": "Credentials updated successfully.",
        "logout_required": False,
        "new_username": current_user.username,
        "access_token": new_token,
        "token_type": "bearer"
    }