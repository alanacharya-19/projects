from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

USGS_EARTHQUAKE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
NASA_FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


@router.get("/earthquakes")
async def get_earthquakes(
    min_magnitude: float = Query(0.0, description="Minimum magnitude"),
    max_magnitude: Optional[float] = Query(None, description="Maximum magnitude"),
    min_latitude: Optional[float] = Query(None, description="Min latitude for bbox"),
    max_latitude: Optional[float] = Query(None, description="Max latitude for bbox"),
    min_longitude: Optional[float] = Query(None, description="Min longitude for bbox"),
    max_longitude: Optional[float] = Query(None, description="Max longitude for bbox"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    params = {
        "format": "geojson",
        "minmagnitude": min_magnitude,
        "limit": limit,
        "orderby": "time",
    }

    if max_magnitude is not None:
        params["maxmagnitude"] = max_magnitude

    if all(v is not None for v in [min_latitude, max_latitude, min_longitude, max_longitude]):
        params["minlatitude"] = min_latitude
        params["maxlatitude"] = max_latitude
        params["minlongitude"] = min_longitude
        params["maxlongitude"] = max_longitude

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(USGS_EARTHQUAKE_URL, params=params)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="USGS service error")
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to USGS service")


@router.get("/wildfires")
async def get_wildfires(
    latitude: float = Query(..., description="Center latitude"),
    longitude: float = Query(..., description="Center longitude"),
    radius_km: int = Query(50, description="Search radius in km"),
    days: int = Query(1, ge=1, le=10, description="Days of data (1-10)"),
    current_user: User = Depends(get_current_user),
):
    if not settings.NASA_FIRMS_KEY:
        raise HTTPException(status_code=503, detail="NASA FIRMS API key not configured")

    map_key = settings.NASA_FIRMS_KEY
    url = f"{NASA_FIRMS_URL}/{map_key}/{days}/{latitude},{longitude},{radius_km}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="NASA FIRMS service error")
            return {"data": response.text}
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to NASA FIRMS service")


@router.get("/floods")
async def get_floods(
    latitude: float = Query(..., description="Center latitude"),
    longitude: float = Query(..., description="Center longitude"),
    radius_km: int = Query(100, description="Search radius in km"),
    current_user: User = Depends(get_current_user),
):
    params = {
        "format": "json",
        "lat": latitude,
        "lon": longitude,
        "radius": radius_km,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                "https://flood-api.open-meteo.com/v1/flood",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "past_days": 7,
                    "forecast_days": 7,
                },
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Flood data service error")
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to flood data service")
