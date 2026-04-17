from fastapi import FastAPI
from app.routers import access_requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.database import engine, Base

# Import ALL routers
from app.routers import auth, users, predict, patients, analytics, admin
from app.routers import appointments, messages

# Try to import researcher
try:
    from app.routers import researcher
    researcher_available = True
except ImportError:
    researcher_available = False

# ── NOUVEAU: Try to import payments ───────────────────────────────────────────
try:
    from app.routers import payments
    payments_available = True
except ImportError:
    payments_available = False

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="RadiSense AI API",
    description="AI-Powered Medical Imaging Analysis Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Static files for uploads
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    os.makedirs(os.path.join(uploads_dir, "avatars"))
    os.makedirs(os.path.join(uploads_dir, "xrays"))
    os.makedirs(os.path.join(uploads_dir, "heatmaps"))
    os.makedirs(os.path.join(uploads_dir, "reports"))

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include routers WITHOUT repeating prefix (routers already have prefix="/xxx")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")

app.include_router(predict.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(access_requests.router, prefix="/api")
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])

if researcher_available:
    app.include_router(researcher.router, prefix="/api")

# ── NOUVEAU: payments router ──────────────────────────────────────────────────
if payments_available:
    app.include_router(payments.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "RadiSense AI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }

# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_service": "ready"
    }

# API info
@app.get("/api/info")
async def api_info():
    endpoints = {
        "authentication": "/api/auth",
        "users": "/api/users",
        "predictions": "/api/predict",
        "patients": "/api/patients",
        "analytics": "/api/analytics",
        "admin": "/api/admin",
        "researcher": "/api/researcher",
        "payments": "/api/payments",       # NOUVEAU
    }
    
    return {
        "name": "RadiSense AI",
        "version": "1.0.0",
        "description": "AI-Powered Medical Imaging Analysis",
        "endpoints": endpoints,
        "total_routes": 50
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)