from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserSettingsBase(BaseModel):
    theme: str = "system"
    language: str = "en"
    notification_enabled: bool = True
    alert_radius_km: float = 50.0
    severity_threshold: str = "moderate"
    preferred_unit: str = "metric"


class UserSettingsResponse(UserSettingsBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    notification_enabled: Optional[bool] = None
    alert_radius_km: Optional[float] = None
    severity_threshold: Optional[str] = None
    preferred_unit: Optional[str] = None


class SavedLocationBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    is_default: bool = False


class SavedLocationCreate(SavedLocationBase):
    pass


class SavedLocationResponse(SavedLocationBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True


class EmergencyContactBase(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = None
    is_primary: bool = False


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactResponse(EmergencyContactBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True
