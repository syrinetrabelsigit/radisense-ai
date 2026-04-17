from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    # Basic fields
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)  # Cloudinary URL — élargi à 500
    bio = Column(Text, nullable=True)

    role = Column(String(20), nullable=False)

    # Plan field (set by admin or Stripe webhook)
    # free | pro | enterprise | researcher_pro | researcher_enterprise
    plan = Column(String(30), nullable=True, default="free")

    # Status fields
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)

    # Settings
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    must_change_password = Column(Boolean, default=False)

    # Radiologist specific
    specialty = Column(String(100), nullable=True)
    license_number = Column(String(50), nullable=True)
    # ── Cabinet / Clinique (NOUVEAU) ─────────────────────────────────────────
    cabinet_name    = Column(String(200), nullable=True)   # Nom du cabinet/clinique
    cabinet_address = Column(String(300), nullable=True)   # Adresse complète (rue, n°)
    cabinet_phone   = Column(String(30),  nullable=True)   # Téléphone du cabinet
    region          = Column(String(100), nullable=True)   # Région / Wilaya / State

    # Researcher specific
    institution = Column(String(200), nullable=True)
    orcid = Column(String(50), nullable=True)

    # Common professional fields (radiologist + researcher)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    years_experience = Column(String(20), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User {self.username} ({self.role}) plan={self.plan}>"