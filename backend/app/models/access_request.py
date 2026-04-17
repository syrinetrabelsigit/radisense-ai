from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from app.core.database import Base

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id                    = Column(Integer, primary_key=True, index=True)
    name                  = Column(String(100), nullable=False)
    email                 = Column(String(100), nullable=False, index=True)
    institution           = Column(String(200), nullable=True)
    role                  = Column(String(50), nullable=False)  # patient, radiologist, researcher, institution
    message               = Column(Text, nullable=True)

    # Plan & Payment
    plan                  = Column(String(20), nullable=False, default='free')  # free, pro, enterprise
    billing               = Column(String(20), nullable=True)   # monthly, yearly
    amount                = Column(Float, nullable=True)
    currency              = Column(String(10), nullable=True, default='usd')

    # Stripe
    stripe_session_id     = Column(String(200), nullable=True)
    stripe_payment_status = Column(String(50), nullable=True)   # paid, unpaid, pending
    stripe_customer_id    = Column(String(200), nullable=True)

    # Admin review
    status                = Column(String(20), nullable=False, default='pending')  # pending, approved, rejected
    reviewed_by           = Column(Integer, nullable=True)
    reviewed_at           = Column(DateTime(timezone=True), nullable=True)
    rejection_reason      = Column(Text, nullable=True)

    # Generated credentials (set when approved)
    generated_username    = Column(String(100), nullable=True)
    generated_password    = Column(String(100), nullable=True)

    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), onupdate=func.now())