from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func

from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Report data
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    report_type = Column(String(50), nullable=False)  # pdf, docx, etc.
    file_path = Column(String(500), nullable=True)
    
    # Metadata - RENOMMÉ EN meta_data
    meta_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Report {self.id} - Analysis {self.analysis_id}>"