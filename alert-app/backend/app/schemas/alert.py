from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel


class AlertRecordBase(BaseModel):
    title: str
    message: str
    severity: str
    type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = None
    external_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    metadata_: Optional[Dict[str, Any]] = None


class AlertRecordCreate(AlertRecordBase):
    pass


class AlertRecordResponse(AlertRecordBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserAlertBase(BaseModel):
    is_read: bool = False
    is_dismissed: bool = False


class UserAlertCreate(BaseModel):
    alert_id: UUID


class UserAlertResponse(UserAlertBase):
    id: UUID
    user_id: UUID
    alert_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class AlertFilter(BaseModel):
    severity: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    skip: int = 0
    limit: int = 50
