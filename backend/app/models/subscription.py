from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Stripe IDs
    stripe_customer_id   = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    stripe_session_id    = Column(String(200), nullable=True)

    # Plan info
    plan                 = Column(String(20), nullable=False)   # starter / pro / enterprise
    status               = Column(String(20), default="pending") # pending / active / cancelled / expired

    # Billing
    amount               = Column(Float, nullable=True)
    currency             = Column(String(10), default="usd")
    billing_period       = Column(String(20), default="monthly")

    # Dates
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end   = Column(DateTime(timezone=True), nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Subscription user={self.user_id} plan={self.plan} status={self.status}>"