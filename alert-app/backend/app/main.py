from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import auth, alerts, weather, disasters, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="AlertGuard API",
    description="Disaster alert and weather monitoring backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(disasters.router, prefix="/api/disasters", tags=["Disasters"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "AlertGuard API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=settings.DEBUG)
