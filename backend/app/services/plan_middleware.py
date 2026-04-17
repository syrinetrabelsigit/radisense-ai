"""
Plan enforcement middleware.
Checks monthly analysis quota before allowing a prediction.

Plans:
  free       →  10 analyses / month
  pro        → 500 analyses / month
  enterprise →  unlimited
  admin      →  unlimited (bypass)
  radiologist→  uses their institution's plan OR free default
"""
from datetime import datetime, timezone
from calendar import monthrange

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.analysis import Analysis


# ── Plan limits ────────────────────────────────────────────────────────────────
PLAN_LIMITS = {
    "free":       10,
    "pro":        500,
    "enterprise": None,   # None = unlimited
    "admin":      None,
    "researcher": None,
}


def get_user_plan(user: User, db: Session) -> str:
    """
    Return the active plan for a user.
    Priority: active Stripe subscription → user.plan field → 'free'
    """
    # 1. Check active Stripe subscription
    try:
        from app.models.subscription import Subscription
        sub = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == user.id,
                Subscription.status == "active",
            )
            .order_by(Subscription.created_at.desc())
            .first()
        )
        if sub:
            return sub.plan  # 'pro' | 'enterprise'
    except Exception:
        pass

    # 2. Fallback to user.plan column (set by admin)
    if hasattr(user, "plan") and user.plan:
        return user.plan

    # 3. Admin / researcher bypass
    if user.role in ("admin", "researcher"):
        return user.role

    # 4. Default free
    return "free"


def get_monthly_analysis_count(user_id: int, db: Session) -> int:
    """Count analyses done by this user in the current calendar month."""
    now = datetime.now(timezone.utc)
    first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day_num = monthrange(now.year, now.month)[1]
    last_day = now.replace(day=last_day_num, hour=23, minute=59, second=59)

    count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.created_at >= first_day,
            Analysis.created_at <= last_day,
        )
        .scalar()
    )
    return count or 0


def check_plan_quota(user: User, db: Session) -> dict:
    """
    Raises HTTP 429 if user has exceeded their monthly quota.
    Returns quota info dict on success.
    """
    plan  = get_user_plan(user, db)
    limit = PLAN_LIMITS.get(plan, 10)  # default 10 if unknown plan

    # Unlimited plans
    if limit is None:
        return {
            "plan":      plan,
            "used":      get_monthly_analysis_count(user.id, db),
            "limit":     None,
            "remaining": None,
            "unlimited": True,
        }

    used      = get_monthly_analysis_count(user.id, db)
    remaining = limit - used

    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error":     "monthly_quota_exceeded",
                "message":   f"You have reached your monthly limit of {limit} analyses.",
                "plan":      plan,
                "used":      used,
                "limit":     limit,
                "remaining": 0,
                "upgrade_url": "http://localhost:5173/pricing",
            },
        )

    return {
        "plan":      plan,
        "used":      used,
        "limit":     limit,
        "remaining": remaining,
        "unlimited": False,
    }