from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.alert import AlertRecord, UserAlert
from app.schemas.alert import (
    AlertRecordCreate,
    AlertRecordResponse,
    UserAlertResponse,
    AlertFilter,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=list[AlertRecordResponse])
async def list_alerts(
    severity: Optional[str] = None,
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(AlertRecord)

    if severity:
        query = query.where(AlertRecord.severity == severity)
    if type:
        query = query.where(AlertRecord.type == type)
    if start_date:
        query = query.where(AlertRecord.start_time >= start_date)
    if end_date:
        query = query.where(AlertRecord.end_time <= end_date)

    query = query.order_by(AlertRecord.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertRecordResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlertRecord).where(AlertRecord.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.post("/", response_model=AlertRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_in: AlertRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = AlertRecord(
        user_id=current_user.id,
        title=alert_in.title,
        message=alert_in.message,
        severity=alert_in.severity,
        type=alert_in.type,
        latitude=alert_in.latitude,
        longitude=alert_in.longitude,
        source=alert_in.source,
        external_id=alert_in.external_id,
        start_time=alert_in.start_time,
        end_time=alert_in.end_time,
        metadata_=alert_in.metadata_ or {},
    )
    db.add(alert)
    await db.flush()
    return alert


@router.put("/{alert_id}/read", response_model=UserAlertResponse)
async def mark_as_read(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserAlert).where(
            UserAlert.user_id == current_user.id,
            UserAlert.alert_id == alert_id,
        )
    )
    user_alert = result.scalar_one_or_none()

    if not user_alert:
        user_alert = UserAlert(
            user_id=current_user.id,
            alert_id=alert_id,
            is_read=True,
        )
        db.add(user_alert)
    else:
        user_alert.is_read = True

    await db.flush()
    return user_alert


@router.put("/{alert_id}/dismiss", response_model=UserAlertResponse)
async def dismiss_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserAlert).where(
            UserAlert.user_id == current_user.id,
            UserAlert.alert_id == alert_id,
        )
    )
    user_alert = result.scalar_one_or_none()

    if not user_alert:
        user_alert = UserAlert(
            user_id=current_user.id,
            alert_id=alert_id,
            is_dismissed=True,
        )
        db.add(user_alert)
    else:
        user_alert.is_dismissed = True

    await db.flush()
    return user_alert
