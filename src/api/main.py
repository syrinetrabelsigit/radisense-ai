from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .core.config import settings
from .core.database import init_db
from .routers import (
    auth_router,
    predict_router,
    patients_router,
    users_router,        
    analytics_router,    
    admin_router         
)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Chest X-Ray Analysis Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(patients_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)        # ← AJOUTER
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)    # ← AJOUTER
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)        # ← AJOUTER


@app.on_event("startup")
async def startup_event():
    print("🚀 Starting RadiSense AI API...")
    init_db()
    print("✅ API ready!")


@app.get("/")
def root():
    return {
        "message": "RadiSense AI API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
