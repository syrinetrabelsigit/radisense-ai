from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class ReportType(str, enum.Enum):
    PDF = "pdf"
    JSON = "json"
    DICOM = "dicom"


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    report_type = Column(Enum(ReportType), default=ReportType.PDF)
    file_path = Column(String(255))
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    analysis = relationship("Analysis")