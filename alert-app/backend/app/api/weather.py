from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"
OPENAQ_BASE = "https://api.openaq.org/v2"


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", description="Units: metric, imperial, standard"),
    current_user: User = Depends(get_current_user),
):
    if not settings.OPENWEATHER_API_KEY:
        raise HTTPException(status_code=503, detail="OpenWeather API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{OPENWEATHER_BASE}/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": units,
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Weather service error")
        return response.json()


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", description="Units: metric, imperial, standard"),
    cnt: Optional[int] = Query(None, description="Number of timestamps (1-40)"),
    current_user: User = Depends(get_current_user),
):
    if not settings.OPENWEATHER_API_KEY:
        raise HTTPException(status_code=503, detail="OpenWeather API key not configured")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": units,
    }
    if cnt:
        params["cnt"] = cnt

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{OPENWEATHER_BASE}/forecast", params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Forecast service error")
        return response.json()


@router.get("/air-quality")
async def get_air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: int = Query(1000, description="Search radius in meters"),
    current_user: User = Depends(get_current_user),
):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{OPENAQ_BASE}/latest",
            params={
                "coordinates": f"{lat},{lon}",
                "radius": radius,
                "limit": 10,
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Air quality service error")
        return response.json()
