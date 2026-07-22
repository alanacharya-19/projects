from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserSettings, SavedLocation, EmergencyContact
from app.schemas.user import (
    UserSettingsResponse,
    UserSettingsUpdate,
    SavedLocationCreate,
    SavedLocationResponse,
    EmergencyContactCreate,
    EmergencyContactResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        await db.flush()
    return user_settings


@router.put("/settings", response_model=UserSettingsResponse)
async def update_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()

    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        await db.flush()

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user_settings, field, value)

    await db.flush()
    return user_settings


@router.get("/locations", response_model=list[SavedLocationResponse])
async def list_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedLocation).where(SavedLocation.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/locations", response_model=SavedLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_in: SavedLocationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location = SavedLocation(
        user_id=current_user.id,
        name=location_in.name,
        latitude=location_in.latitude,
        longitude=location_in.longitude,
        is_default=location_in.is_default,
    )
    db.add(location)
    await db.flush()
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedLocation).where(
            SavedLocation.id == location_id,
            SavedLocation.user_id == current_user.id,
        )
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    await db.delete(location)
    await db.flush()


@router.get("/emergency-contacts", response_model=list[EmergencyContactResponse])
async def list_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/emergency-contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    contact_in: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contact = EmergencyContact(
        user_id=current_user.id,
        name=contact_in.name,
        phone=contact_in.phone,
        relationship=contact_in.relationship,
        is_primary=contact_in.is_primary,
    )
    db.add(contact)
    await db.flush()
    return contact


@router.delete("/emergency-contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == current_user.id,
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    await db.delete(contact)
    await db.flush()
