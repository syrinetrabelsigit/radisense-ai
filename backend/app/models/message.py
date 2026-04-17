from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base  # ✅ FIXED
import enum

class SenderTypeEnum(str, enum.Enum):
    patient = "patient"
    radiologist = "radiologist"
    admin = "admin"
    researcher  = "researcher" 

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(Enum(SenderTypeEnum), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_type = Column(Enum(SenderTypeEnum), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())