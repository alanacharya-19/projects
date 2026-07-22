import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Float, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    saved_locations = relationship("SavedLocation", back_populates="user")
    emergency_contacts = relationship("EmergencyContact", back_populates="user")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(50), default="system")
    language = Column(String(10), default="en")
    notification_enabled = Column(Boolean, default=True)
    alert_radius_km = Column(Float, default=50.0)
    severity_threshold = Column(String(50), default="moderate")
    preferred_unit = Column(String(20), default="metric")

    user = relationship("User", back_populates="settings")


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="saved_locations")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    relationship = Column(String(100))
    is_primary = Column(Boolean, default=False)

    user = relationship("User", back_populates="emergency_contacts")
