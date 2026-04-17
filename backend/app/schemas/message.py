from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    recipient_id: int
    recipient_type: Optional[str] = None  # ✅ optionnel, auto-détecté depuis la DB
    subject: str
    message: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_type: str
    recipient_id: int
    recipient_type: str
    subject: str
    message: str
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    sender_name: Optional[str] = None
    recipient_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageMarkRead(BaseModel):
    message_id: int