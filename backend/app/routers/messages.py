from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageMarkRead

router = APIRouter()


def get_display_name(db: Session, user_id: int) -> str:
    """
    Always resolve name directly from User table.
    No enum issues, no full_name issues.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return "Unknown"

    first = user.first_name or ""
    last  = user.last_name  or ""
    name  = f"{first} {last}".strip() or user.username or "Unknown"

    # get role as plain string regardless of enum
    role = user.role.value if hasattr(user.role, "value") else str(user.role)

    return f"Dr. {name}" if role == "radiologist" else name


def serialize(msg: Message, db: Session) -> dict:
    return {
        "id":             msg.id,
        "sender_id":      msg.sender_id,
        "sender_type":    msg.sender_type.value if hasattr(msg.sender_type, "value") else str(msg.sender_type),
        "sender_name":    get_display_name(db, msg.sender_id),
        "recipient_id":   msg.recipient_id,
        "recipient_type": msg.recipient_type.value if hasattr(msg.recipient_type, "value") else str(msg.recipient_type),
        "recipient_name": get_display_name(db, msg.recipient_id),
        "subject":        msg.subject,
        "message":        msg.message,
        "is_read":        msg.is_read,
        "read_at":        msg.read_at,
        "created_at":     msg.created_at,
    }


# ── SEND ─────────────────────────────────────────────────────────────────────

@router.post("/send", status_code=201)
def send_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recipient = db.query(User).filter(User.id == data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    role = recipient.role.value if hasattr(recipient.role, "value") else str(recipient.role)
    sender_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    msg = Message(
        sender_id=current_user.id,
        sender_type=sender_role,
        recipient_id=data.recipient_id,
        recipient_type=role,
        subject=data.subject,
        message=data.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {"message": "Message sent successfully", "message_id": msg.id}


# ── INBOX ────────────────────────────────────────────────────────────────────

@router.get("/inbox")
def get_inbox(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Message).filter(Message.recipient_id == current_user.id)
    if unread_only:
        query = query.filter(Message.is_read == False)
    messages = query.order_by(Message.created_at.desc()).all()
    return [serialize(m, db) for m in messages]


# ── SENT ─────────────────────────────────────────────────────────────────────

@router.get("/sent")
def get_sent_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(Message).filter(
        Message.sender_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return [serialize(m, db) for m in messages]


# ── UNREAD COUNT ─────────────────────────────────────────────────────────────

@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Message).filter(
        Message.recipient_id == current_user.id,
        Message.is_read == False
    ).count()
    return {"unread_count": count}


# ── MARK READ ────────────────────────────────────────────────────────────────

@router.put("/mark-read")
def mark_as_read(
    data: MessageMarkRead,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(
        Message.id == data.message_id,
        Message.recipient_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    msg.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Message marked as read"}


# ── GET ONE ──────────────────────────────────────────────────────────────────

@router.get("/{message_id}")
def get_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if msg.recipient_id == current_user.id and not msg.is_read:
        msg.is_read = True
        msg.read_at = datetime.utcnow()
        db.commit()

    return serialize(msg, db)


# ── DELETE ───────────────────────────────────────────────────────────────────

@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found or not authorized")
    db.delete(msg)
    db.commit()
    return {"message": "Message deleted successfully"}