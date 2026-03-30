import logging
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.logging_config import logger
from app.core.config import settings
from app.db import connect_db, disconnect_db

# ── Routers ────────────────────────────────────────────────────────────────────
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.supervisors import router as supervisors_router
from app.api.invites import router as invites_router
from app.api.shifts import router as shifts_router
from app.api.attendance import router as attendance_router
from app.api.timeoff import router as timeoff_router
from app.api.payroll import router as payroll_router
from app.api.availability import router as availability_router
from app.api.shiftswap import router as shiftswap_router
from app.api.feedback import router as feedback_router

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Campus HR ERP System",
    version="1.0.0",
    description="Workforce management API: shifts, attendance, time-off, and payroll.",
)

uploads_dir = Path(__file__).resolve().parents[2] / ".data" / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router,        prefix="/api", tags=["Auth"])
app.include_router(admin_router,       prefix="/api", tags=["Admin"])
app.include_router(supervisors_router, prefix="/api", tags=["Supervisor"])
app.include_router(invites_router,     prefix="/api", tags=["Invites"])
app.include_router(shifts_router,      prefix="/api", tags=["Shifts"])
app.include_router(attendance_router,  prefix="/api", tags=["Attendance"])
app.include_router(timeoff_router,     prefix="/api", tags=["Time-Off"])
app.include_router(payroll_router,     prefix="/api", tags=["Payroll"])
app.include_router(availability_router, prefix="/api", tags=["Availability"])
app.include_router(shiftswap_router,   prefix="/api", tags=["ShiftSwap"])
app.include_router(feedback_router,    prefix="/api", tags=["Feedback"])

# ── DB lifecycle ───────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting up — connecting to database")
    await connect_db()
    logger.info("Database connected")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down — disconnecting from database")
    await disconnect_db()

# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTPException %s: %s — %s %s", exc.status_code, exc.detail, request.method, request.url)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": app.version}
