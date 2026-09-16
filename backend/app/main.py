from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongo import init_db, close_db
from app.routers import (
    auth, users, teachers, subjects, rooms,
    timetable, leaves, attendance, substitution,
    notifications, ws
)
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting up MyMonitorXX Campus Backend...")
    await init_db()
    yield
    logger.info("🛑 Shutting down MyMonitorXX Campus Backend...")
    await close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Campus Timetable & Live Monitoring API with WebSockets and GPS Check-In",
    lifespan=lifespan
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Transport & Protocol Security: Strict HTTP Headers Middleware (HSTS, nosniff, DENY)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Strict-Transport-Security: Max-age 1 year, includes subdomains, preload eligible
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Production CORS Lockdown: Strictly authorize designated deployment domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(teachers.router, prefix=settings.API_PREFIX)
app.include_router(subjects.router, prefix=settings.API_PREFIX)
app.include_router(rooms.router, prefix=settings.API_PREFIX)
app.include_router(timetable.router, prefix=settings.API_PREFIX)
app.include_router(leaves.router, prefix=settings.API_PREFIX)
app.include_router(attendance.router, prefix=settings.API_PREFIX)
app.include_router(substitution.router, prefix=settings.API_PREFIX)
app.include_router(notifications.router, prefix=settings.API_PREFIX)
app.include_router(ws.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "dev_mode": settings.DEV_MODE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
