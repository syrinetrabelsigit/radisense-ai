from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ========== USER BASE ==========

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str = Field(..., pattern="^(radiologist|patient|researcher|admin)$")


# ========== USER CREATE ==========

class UserCreate(UserBase):
    username: str
    password: str = Field(..., min_length=8)


# ========== USER UPDATE ==========

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

    # Radiologist specific
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    # ── Cabinet (NOUVEAU) ────────────────────────────────────────────────────
    cabinet_name: Optional[str] = None
    cabinet_address: Optional[str] = None
    cabinet_phone: Optional[str] = None
    region: Optional[str] = None

    # Researcher specific
    institution: Optional[str] = None
    orcid: Optional[str] = None

    # Common professional fields
    city: Optional[str] = None
    country: Optional[str] = None
    years_experience: Optional[str] = None


# ========== USER RESPONSE ==========

class UserResponse(UserBase):
    id: int
    username: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    email_notifications: bool
    sms_notifications: bool
    two_factor_enabled: bool
    must_change_password: bool = False
    plan: Optional[str] = None

    # Radiologist specific
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    # ── Cabinet (NOUVEAU) ────────────────────────────────────────────────────
    cabinet_name: Optional[str] = None
    cabinet_address: Optional[str] = None
    cabinet_phone: Optional[str] = None
    region: Optional[str] = None

    # Researcher specific
    institution: Optional[str] = None
    orcid: Optional[str] = None

    # Common professional fields
    city: Optional[str] = None
    country: Optional[str] = None
    years_experience: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== PASSWORD CHANGE ==========

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


# ========== NOTIFICATION SETTINGS ==========

class NotificationSettings(BaseModel):
    email_notifications: bool
    sms_notifications: bool


# ========== LOGIN SCHEMAS ==========

class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None