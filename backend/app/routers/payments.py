"""Stripe payments router — checkout, webhook, cancel, status"""
import stripe
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY
router = APIRouter(prefix="/payments", tags=["payments"])

# ── Price map ──────────────────────────────────────────────────────────────────
PRICE_MAP = {
    # Radiologist
    "pro":                   { "monthly": settings.STRIPE_PRICE_PRO_MONTHLY,                   "yearly": settings.STRIPE_PRICE_PRO_YEARLY },
    "enterprise":            { "monthly": settings.STRIPE_PRICE_ENTERPRISE_MONTHLY,            "yearly": settings.STRIPE_PRICE_ENTERPRISE_YEARLY },
    # Researcher
    "researcher_pro":        { "monthly": settings.STRIPE_PRICE_RESEARCHER_PRO_MONTHLY,        "yearly": settings.STRIPE_PRICE_RESEARCHER_PRO_YEARLY },
    "researcher_enterprise": { "monthly": settings.STRIPE_PRICE_RESEARCHER_ENTERPRISE_MONTHLY, "yearly": settings.STRIPE_PRICE_RESEARCHER_ENTERPRISE_YEARLY },
}

PLAN_AMOUNTS = {
    # Radiologist
    "pro":                   { "monthly": 79,  "yearly": 758  },
    "enterprise":            { "monthly": 199, "yearly": 1910 },
    # Researcher
    "researcher_pro":        { "monthly": 49,  "yearly": 470  },
    "researcher_enterprise": { "monthly": 99,  "yearly": 950  },
}


class CheckoutRequest(BaseModel):
    plan:     str
    billing:  str = "monthly"
    currency: str = "usd"
    success_url: Optional[str] = None
    cancel_url:  Optional[str] = None

class CancelRequest(BaseModel):
    subscription_id: str

class AccessRequest(BaseModel):
    name: str; email: str; institution: str; role: str; message: str = ""


def get_sub_model():
    try:
        from app.models.subscription import Subscription
        return Subscription
    except ImportError:
        return None


# ── 1. Create Checkout Session ─────────────────────────────────────────────────
@router.post("/create-checkout-session")
async def create_checkout_session(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before subscribing. Check your inbox for the verification link."
        )
    plan    = data.plan.lower()
    billing = data.billing.lower()

    if plan not in PRICE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
    if billing not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="billing must be 'monthly' or 'yearly'")

    price_id = PRICE_MAP[plan][billing]
    amount   = PLAN_AMOUNTS[plan][billing]
    base_url = settings.FRONTEND_URL or "http://localhost:5173"

    try:
        customers = stripe.Customer.list(email=current_user.email, limit=1)
        customer  = customers.data[0] if customers.data else stripe.Customer.create(
            email=current_user.email,
            name=f"{current_user.first_name} {current_user.last_name}",
            metadata={"user_id": str(current_user.id)},
        )

        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=data.success_url or f"{base_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&plan={plan}&billing={billing}",
            cancel_url=data.cancel_url or f"{base_url}/pricing?cancelled=true",
            metadata={"user_id": str(current_user.id), "plan": plan, "billing": billing, "currency": data.currency},
            subscription_data={"metadata": {"user_id": str(current_user.id), "plan": plan}},
            allow_promotion_codes=True,
        )

        return {"checkout_url": session.url, "session_id": session.id, "plan": plan, "billing": billing}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 2. Verify Session ──────────────────────────────────────────────────────────
@router.get("/verify-session/{session_id}")
async def verify_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        session  = stripe.checkout.Session.retrieve(session_id, expand=["subscription", "customer"])
        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")

        plan    = session.metadata.get("plan", "pro")
        billing = session.metadata.get("billing", "monthly")
        sub_data = session.subscription
        amount   = PLAN_AMOUNTS.get(plan, {}).get(billing, 0)

        Sub = get_sub_model()
        if Sub:
            if not db.query(Sub).filter(Sub.stripe_session_id == session_id).first():
                db.add(Sub(
                    user_id=current_user.id,
                    stripe_customer_id=getattr(session.customer, "id", str(session.customer)),
                    stripe_subscription_id=sub_data.id if sub_data else None,
                    stripe_session_id=session_id,
                    plan=plan, status="active", amount=amount,
                    currency=session.currency or "usd", billing_period=billing,
                    current_period_start=datetime.fromtimestamp(sub_data.current_period_start, tz=timezone.utc) if sub_data else None,
                    current_period_end=datetime.fromtimestamp(sub_data.current_period_end, tz=timezone.utc) if sub_data else None,
                ))
                current_user.plan = plan
                db.commit()

                try:
                    from app.services.email_service import send_payment_success_email, send_welcome_email
                    import asyncio
                    asyncio.create_task(send_payment_success_email(
                        to_email=current_user.email,
                        user_name=f"{current_user.first_name} {current_user.last_name}",
                        plan=plan, amount=amount, currency=session.currency or "usd",
                        subscription_id=sub_data.id if sub_data else session_id,
                    ))
                except Exception as e:
                    logger.error(f"Email: {e}")

        return {"success": True, "plan": plan, "billing": billing,
                "subscription_id": sub_data.id if sub_data else None,
                "status": "active", "amount": amount, "currency": session.currency or "usd"}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 3. My subscription ─────────────────────────────────────────────────────────
@router.get("/my-subscription")
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    Sub = get_sub_model()
    if not Sub:
        return {"plan": current_user.plan or "free", "status": "none"}

    sub = db.query(Sub).filter(Sub.user_id == current_user.id, Sub.status == "active"
        ).order_by(Sub.created_at.desc()).first()

    if not sub:
        return {"plan": current_user.plan or "free", "status": "none"}

    return {
        "plan": sub.plan, "billing": sub.billing_period, "status": sub.status,
        "amount": sub.amount, "currency": sub.currency,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "stripe_subscription_id": sub.stripe_subscription_id,
    }


# ── 4. Cancel ──────────────────────────────────────────────────────────────────
@router.post("/cancel")
async def cancel_subscription(
    data: CancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        sub = stripe.Subscription.modify(data.subscription_id, cancel_at_period_end=True)
        Sub = get_sub_model()
        if Sub:
            db_sub = db.query(Sub).filter(Sub.stripe_subscription_id == data.subscription_id, Sub.user_id == current_user.id).first()
            if db_sub:
                db_sub.status = "cancelled"
                db.commit()
                try:
                    from app.services.email_service import send_cancellation_email
                    import asyncio
                    asyncio.create_task(send_cancellation_email(
                        to_email=current_user.email,
                        user_name=f"{current_user.first_name} {current_user.last_name}",
                        plan=db_sub.plan,
                        end_date=datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc).strftime("%B %d, %Y"),
                    ))
                except Exception as e:
                    logger.error(f"Email: {e}")
        return {"message": "Subscription will be cancelled at period end"}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 5. Webhook ─────────────────────────────────────────────────────────────────
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    Sub = get_sub_model()
    if event["type"] == "customer.subscription.deleted":
        sub_obj = event["data"]["object"]
        if Sub:
            db_sub = db.query(Sub).filter(Sub.stripe_subscription_id == sub_obj["id"]).first()
            if db_sub:
                db_sub.status = "expired"
                user = db.query(User).filter(User.id == db_sub.user_id).first()
                if user: user.plan = "free"
                db.commit()

    elif event["type"] == "customer.subscription.updated":
        sub_obj = event["data"]["object"]
        if Sub:
            db_sub = db.query(Sub).filter(Sub.stripe_subscription_id == sub_obj["id"]).first()
            if db_sub:
                db_sub.status = sub_obj.get("status", db_sub.status)
                db.commit()

    return {"received": True}


# ── 6. Request Access ──────────────────────────────────────────────────────────
@router.post("/request-access")
async def request_access(data: AccessRequest):
    try:
        from app.services.email_service import send_access_request_email
        await send_access_request_email(name=data.name, email=data.email, institution=data.institution, role=data.role, message=data.message)
        return {"message": "Request sent. Our team will contact you within 48 hours."}
    except Exception as e:
        logger.error(f"Access request: {e}")
        return {"message": "Request received."}


# ── 7. Admin: assign plan ─────────────────────────────────────────────────────
@router.put("/admin/assign-plan/{user_id}")
async def assign_plan(
    user_id: int, plan: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if plan not in ["free", "pro", "enterprise", "researcher_pro", "researcher_enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = plan
    db.commit()
    return {"message": f"Plan '{plan}' assigned to {user.username}", "user_id": user_id, "plan": plan}