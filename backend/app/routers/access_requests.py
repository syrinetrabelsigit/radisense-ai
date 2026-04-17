import secrets
import string
import stripe
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.core.config import settings
from app.models.user import User
from app.models.access_request import AccessRequest

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/access-requests", tags=["access-requests"])

PLAN_AMOUNTS = {
    # Radiologist
    "pro":                   {"monthly": 79,  "yearly": 758},
    "enterprise":            {"monthly": 199, "yearly": 1910},
    # Researcher
    "researcher_pro":        {"monthly": 49,  "yearly": 470},
    "researcher_enterprise": {"monthly": 99,  "yearly": 950},
}

PAID_PLANS = ('pro', 'enterprise', 'researcher_pro', 'researcher_enterprise')


class SubmitRequest(BaseModel):
    name:              str
    email:             str
    institution:       Optional[str] = None
    role:              str
    message:           Optional[str] = None
    plan:              str = "free"
    billing:           Optional[str] = "monthly"
    currency:          Optional[str] = "usd"
    stripe_session_id: Optional[str] = None


class ReviewRequest(BaseModel):
    action:           str  # approve or reject
    rejection_reason: Optional[str] = None

class CheckEmailRequest(BaseModel):
    email: str
    role:  str

@router.post("/check-email")
async def check_email(
    data: CheckEmailRequest,
    db: Session = Depends(get_db)
):
    """Check if email already exists for this role — called BEFORE payment"""
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()
    existing_request = db.query(AccessRequest).filter(
        AccessRequest.email == data.email,
        AccessRequest.status == 'pending'
    ).first()
    return {
        "exists": existing_user is not None,
        "pending_request": existing_request is not None
    }


def generate_password(length=12):
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(secrets.choice(chars) for _ in range(length))


def generate_username(name: str, db: Session) -> str:
    # Remove title prefix (Dr., Prof., etc.)
    clean = name
    for prefix in ['Dr.', 'Prof.', 'Pr.', 'Ass. Prof.']:
        clean = clean.replace(prefix, '').strip()
    base = clean.lower().replace(' ', '.').replace('-', '')[:20]
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username


def parse_professional_fields(message: str, institution_raw: str) -> dict:
    """
    Parse message and institution fields from the new Register form.

    message format:  "Specialty: X | License: Y | Experience: Z | Phone: W | ..."
    institution format (radiologist): "Hospital, City, Country"
    institution format (researcher):  "University — Department"
    """
    result = {
        "specialty": None,
        "license_number": None,
        "years_experience": None,
        "phone": None,
        "institution": None,
        "city": None,
        "country": None,
        "orcid": None,
    }

    # Parse message fields
    if message:
        for part in message.split(' | '):
            if ': ' in part:
                k, v = part.split(': ', 1)
                k = k.strip().lower()
                v = v.strip()
                if 'specialty' in k:
                    result["specialty"] = v
                elif 'license' in k:
                    result["license_number"] = v
                elif 'experience' in k:
                    result["years_experience"] = v
                elif 'phone' in k:
                    result["phone"] = v
                elif 'orcid' in k:
                    result["orcid"] = v

    # Parse institution field
    if institution_raw:
        # Researcher format: "University — Department"
        if ' — ' in institution_raw:
            parts = institution_raw.split(' — ')
            result["institution"] = parts[0].strip()
        # Radiologist format: "Hospital, City, Country"
        elif ', ' in institution_raw:
            parts = [p.strip() for p in institution_raw.split(', ')]
            if len(parts) >= 3:
                result["institution"] = parts[0]
                result["city"] = parts[1]
                result["country"] = parts[2]
            elif len(parts) == 2:
                result["institution"] = parts[0]
                result["country"] = parts[1]
            else:
                result["institution"] = institution_raw
        else:
            result["institution"] = institution_raw

    return result


def clean_name(full_name: str) -> tuple:
    """Remove title prefix and split into first/last name."""
    name = full_name
    for prefix in ['Dr.', 'Prof.', 'Pr.', 'Ass. Prof.']:
        name = name.replace(prefix, '').strip()
    parts = name.split()
    first = parts[0] if parts else full_name
    last = ' '.join(parts[1:]) if len(parts) > 1 else ''
    return first, last


# ── 1. Submit Request ──────────────────────────────────────────────────────────
@router.post("/submit")
async def submit_request(data: SubmitRequest, db: Session = Depends(get_db)):
    """Anyone submits an access request — with or without payment"""

    # Check duplicate pending request
    existing = db.query(AccessRequest).filter(
        AccessRequest.email == data.email,
        AccessRequest.status == 'pending'
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A pending request already exists for this email."
        )

    # ✅ Vérifier si le mail existe déjà pour CE rôle AVANT le paiement
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please login instead."
        )

    # Verify Stripe payment if plan is paid
    stripe_payment_status = 'unpaid'
    stripe_customer_id = None
    amount = 0

    if data.plan in PAID_PLANS and data.stripe_session_id:
        try:
            session = stripe.checkout.Session.retrieve(data.stripe_session_id)
            if session.payment_status == 'paid':
                stripe_payment_status = 'paid'
                stripe_customer_id = str(session.customer) if session.customer else None
                amount = PLAN_AMOUNTS.get(data.plan, {}).get(data.billing or 'monthly', 0)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Payment not completed. Please complete payment first."
                )
        except stripe.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    elif data.plan in PAID_PLANS and not data.stripe_session_id:
        raise HTTPException(status_code=400, detail="Payment required for this plan.")

    # Create request
    req = AccessRequest(
        name=data.name,
        email=data.email,
        institution=data.institution,
        role=data.role,
        message=data.message,
        plan=data.plan,
        billing=data.billing,
        amount=amount,
        currency=data.currency,
        stripe_session_id=data.stripe_session_id,
        stripe_payment_status=stripe_payment_status,
        stripe_customer_id=stripe_customer_id,
        status='pending',
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Send notification email to admin
    try:
        from app.services.email_service import send_access_request_email
        await send_access_request_email(
            name=data.name,
            email=data.email,
            institution=data.institution or '',
            role=data.role,
            message=data.message or '',
            plan=data.plan,
            amount=amount,
            payment_status=stripe_payment_status,
            request_id=req.id,
        )
    except Exception as e:
        logger.error(f"Email error: {e}")

    # ✅ Si paiement confirmé → envoyer email de confirmation au client
    if stripe_payment_status == 'paid' and amount > 0:
        try:
            from app.services.email_service import send_payment_success_email
            await send_payment_success_email(
                to_email=data.email,
                user_name=data.name,
                plan=data.plan,
                amount=float(amount),
                currency=data.currency or 'usd',
                subscription_id=data.stripe_session_id or req.id,
            )
        except Exception as e:
            logger.error(f"Payment confirmation email error: {e}")

    return {
        "message": "Request submitted successfully. Our team will review and contact you within 48 hours.",
        "request_id": req.id,
        "plan": data.plan,
        "payment_status": stripe_payment_status,
    }


# ── 2. Create Checkout for Request ────────────────────────────────────────────
@router.post("/create-checkout")
async def create_checkout_for_request(
    data: dict,
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for an access request (no login needed)"""
    plan     = data.get('plan', 'pro')
    billing  = data.get('billing', 'monthly')
    email    = data.get('email', '')
    name     = data.get('name', '')
    currency = data.get('currency', 'usd')

    from app.routers.payments import PRICE_MAP
    if plan not in PRICE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    price_id = PRICE_MAP[plan][billing]
    base_url = settings.FRONTEND_URL or "http://localhost:5173"

    try:
        customers = stripe.Customer.list(email=email, limit=1)
        customer = customers.data[0] if customers.data else stripe.Customer.create(
            email=email, name=name,
            metadata={"type": "access_request", "plan": plan}
        )

        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{base_url}/register/complete?session_id={{CHECKOUT_SESSION_ID}}&plan={plan}&billing={billing}",
            cancel_url=f"{base_url}/register?cancelled=true",
            metadata={"type": "access_request", "plan": plan, "billing": billing},
            allow_promotion_codes=True,
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 3. List Requests (Admin) ───────────────────────────────────────────────────
@router.get("/")
async def list_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")

    query = db.query(AccessRequest).order_by(AccessRequest.created_at.desc())
    if status:
        query = query.filter(AccessRequest.status == status)

    reqs = query.all()
    return {
        "total":    len(reqs),
        "pending":  len([r for r in reqs if r.status == 'pending']),
        "approved": len([r for r in reqs if r.status == 'approved']),
        "rejected": len([r for r in reqs if r.status == 'rejected']),
        "requests": [
            {
                "id":                    r.id,
                "name":                  r.name,
                "email":                 r.email,
                "institution":           r.institution,
                "role":                  r.role,
                "message":               r.message,
                "plan":                  r.plan,
                "billing":               r.billing,
                "amount":                r.amount,
                "currency":              r.currency,
                "stripe_payment_status": r.stripe_payment_status,
                "status":                r.status,
                "rejection_reason":      r.rejection_reason,
                "created_at":            r.created_at.isoformat() if r.created_at else None,
                "reviewed_at":           r.reviewed_at.isoformat() if r.reviewed_at else None,
            }
            for r in reqs
        ]
    }


# ── 4. Review Request (Admin) ─────────────────────────────────────────────────
@router.put("/{request_id}/review")
async def review_request(
    request_id: int,
    data: ReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")

    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request already reviewed")

    if data.action == 'approve':

        # Check email not already used
        existing_email = db.query(User).filter(User.email == req.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"An account already exists with email {req.email}. Cannot create duplicate."
            )

        # Generate credentials
        username = generate_username(req.name, db)
        password = generate_password()

        # Parse professional fields from message + institution
        fields = parse_professional_fields(
            message=req.message or '',
            institution_raw=req.institution or ''
        )

        # Clean name (remove title prefix)
        first_name, last_name = clean_name(req.name)

        # Create user account with all professional fields
        new_user = User(
            username=username,
            email=req.email,
            hashed_password=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            role=req.role if req.role in ('radiologist', 'researcher', 'patient') else 'patient',
            plan=req.plan,
            is_active=True,
            email_verified=True,
            must_change_password=True,
            # Professional fields parsed from form
            phone=fields["phone"],
            institution=fields["institution"],
            specialty=fields["specialty"],
            license_number=fields["license_number"],
            years_experience=fields["years_experience"],
            city=fields["city"],
            country=fields["country"],
            orcid=fields["orcid"],
        )
        db.add(new_user)

        req.status = 'approved'
        req.reviewed_by = current_user.id
        req.reviewed_at = datetime.now(timezone.utc)
        req.generated_username = username
        req.generated_password = password
        db.commit()

        # Send approval email with credentials
        try:
            from app.services.email_service import send_approval_email
            await send_approval_email(
                to_email=req.email,
                name=req.name,
                username=username,
                password=password,
                plan=req.plan,
            )
        except Exception as e:
            logger.error(f"Approval email error: {e}")

        return {
            "message": f"Request approved. Account created for {req.email}",
            "username": username
        }

    elif data.action == 'reject':
        req.status = 'rejected'
        req.reviewed_by = current_user.id
        req.reviewed_at = datetime.now(timezone.utc)
        req.rejection_reason = data.rejection_reason

        # Refund if paid — cancel the Stripe subscription
        if req.stripe_payment_status == 'paid' and req.stripe_session_id:
            try:
                session = stripe.checkout.Session.retrieve(
                    req.stripe_session_id, expand=['subscription']
                )
                if session.subscription:
                    stripe.Subscription.delete(session.subscription.id)
            except Exception as e:
                logger.error(f"Refund error: {e}")

        db.commit()

        # Send rejection email
        try:
            from app.services.email_service import send_rejection_email
            await send_rejection_email(
                to_email=req.email,
                name=req.name,
                reason=data.rejection_reason or "Your request did not meet our requirements.",
            )
        except Exception as e:
            logger.error(f"Rejection email error: {e}")

        return {"message": "Request rejected."}

    raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")