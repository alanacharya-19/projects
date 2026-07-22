import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Float, Text, Boolean
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class SeverityLevel(str, enum.Enum):
    minor = "minor"
    moderate = "moderate"
    severe = "severe"
    extreme = "extreme"
    emergency = "emergency"


class AlertType(str, enum.Enum):
    weather = "weather"
    earthquake = "earthquake"
    flood = "flood"
    wildfire = "wildfire"
    storm = "storm"
    heatwave = "heatwave"
    other = "other"


class AlertRecord(Base):
    __tablename__ = "alert_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)
    type = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    source = Column(String(100))
    external_id = Column(String(255))
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    metadata_ = Column("metadata", JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    user_alerts = relationship("UserAlert", back_populates="alert")


class UserAlert(Base):
    __tablename__ = "user_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alert_records.id", ondelete="CASCADE"), nullable=False)
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("AlertRecord", back_populates="user_alerts")
