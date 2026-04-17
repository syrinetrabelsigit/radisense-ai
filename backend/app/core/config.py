from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "RadiSense AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost/radisense_db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = ['.jpg', '.jpeg', '.png', '.dcm']
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/jpg"]
    UPLOAD_DIR: str = "uploads"

    # ML Settings
    IMAGE_SIZE: int = 224

    # ── Email Gmail SMTP ───────────────────────────────────────────────────────
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "syrine.tr123@gmail.com"
    SMTP_PASSWORD: str = "ckfz seqw nxgj dvfm"
    FROM_EMAIL: str = "syrine.tr123@gmail.com"

    # ── Stripe ─────────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str      = "sk_test_51SyAkF0LY06YFO7p6IXeyEsS1eTHayUWNRMx2HGW2yydaGIZvuFoPhFr8QrgRrfQRfbb9IBEml73EqQwHJt37uto00IxQadvIi"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_51SyAkF0LY06YFO7pHFXLZqLwPSaNxwrQq5Ux4exBEpalSxSwSjq21wPMPV7V3sEfVHbX7WCQcvD04TZPZhOh1crs00IAyATshg"
    STRIPE_WEBHOOK_SECRET: str  = "whsec_8783c18d5cdd4d2749b0f349bbb28d33553dd187b7716851a1337631b6881824"

    # ── Stripe Price IDs ───────────────────────────────────────────────────────
    STRIPE_PRICE_PRO_MONTHLY: str        = "price_1TDkKb0LY06YFO7pqE8AiVp5"
    STRIPE_PRICE_ENTERPRISE_MONTHLY: str = "price_1TDkKz0LY06YFO7p4k59DRpe"
    STRIPE_PRICE_PRO_YEARLY: str         = "price_1TDn070LY06YFO7pIxezHabA"
    STRIPE_PRICE_ENTERPRISE_YEARLY: str  = "price_1TDn120LY06YFO7pw7slcz5M"
    STRIPE_PRICE_RESEARCHER_PRO_MONTHLY: str        = "price_1TFLev0LY06YFO7pMFjX24FL"
    STRIPE_PRICE_RESEARCHER_PRO_YEARLY: str         = "price_1TFLfK0LY06YFO7psON6QqyX"
    STRIPE_PRICE_RESEARCHER_ENTERPRISE_MONTHLY: str = "price_1TFLg90LY06YFO7plgjQYcmG"
    STRIPE_PRICE_RESEARCHER_ENTERPRISE_YEARLY: str  = "price_1TFLgW0LY06YFO7pUi7xKwnw"

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"

    # MLflow
    MLFLOW_TRACKING_URI: Optional[str] = "http://localhost:5000"

    # ── Cloudinary ─────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str = "dugzrvpcj"
    CLOUDINARY_API_KEY: str    = "142619861935573"
    CLOUDINARY_API_SECRET: str = "hNLqkaTLmVsNqYxLFvCT97sNI9E"  

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()