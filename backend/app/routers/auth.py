from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, get_current_user  # ✅ AJOUTÉ
from ..core.config import settings
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token
import logging
from pydantic import BaseModel, Field
from sqlalchemy import text
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", status_code=status.HTTP_403_FORBIDDEN)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Direct registration disabled — use access request flow"""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Direct registration is disabled. Please submit an access request."
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    
    # Find user
    user = db.query(User).filter(User.username == credentials.username).first()
    
    # Verify user and password
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    if not user.email_verified and user.role != 'admin':
        HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Please verify your email before logging in. Check your inbox for the verification link."
    )
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


import secrets
from datetime import datetime, timezone, timedelta

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        # Supprimer les anciens tokens non utilisés
        db.execute(
            text("DELETE FROM password_reset_tokens WHERE user_id = :uid"),
            {"uid": user.id}
        )

        # Générer token sécurisé
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=1)

        db.execute(
            text("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:uid, :token, :exp)"),
            {"uid": user.id, "token": token, "exp": expires}
        )
        db.commit()

        # Envoyer l'email
        try:
            from app.services.email_service import send_password_reset_email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            await send_password_reset_email(
                to_email=user.email,
                name=f"{user.first_name} {user.last_name}",
                reset_url=reset_url,
            )
        except Exception as e:
            logger.error(f"Reset email error: {e}")

    # Toujours retourner succès
    return {"message": "If an account exists with this email, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    # Vérifier le token
    result = db.execute(
        text("SELECT * FROM password_reset_tokens WHERE token = :token AND used = 0"),
        {"token": data.token}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Vérifier expiration
    expires_at = result.expires_at
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Mettre à jour le mot de passe
    user = db.query(User).filter(User.id == result.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    user.updated_at = datetime.utcnow()

    # Marquer le token comme utilisé
    db.execute(
        text("UPDATE password_reset_tokens SET used = 1 WHERE token = :token"),
        {"token": data.token}
    )
    db.commit()

    return {"message": "Password reset successfully"}


# ========== ✅ NOUVEAU: ADMIN ENDPOINT ==========

@router.post("/admin/create-radiologist")
async def create_radiologist(
    username: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ADMIN ONLY: Create a new radiologist account
    """
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access only"
        )
    
    # Vérifier que l'username n'existe pas
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # ✅ Vérifier que l'email n'existe pas POUR CE RÔLE
    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered. Please use a different email."
        )
    # Créer le compte radiologist
    new_radiologist = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        role="radiologist",
        is_active=True,
        email_verified=True
    )
    
    db.add(new_radiologist)
    db.commit()
    db.refresh(new_radiologist)
    
    return {
        "message": "Radiologist created successfully",
        "user_id": new_radiologist.id,
        "username": new_radiologist.username,
        "email": new_radiologist.email,
        "name": f"Dr. {new_radiologist.first_name} {new_radiologist.last_name}"
    }
# ✅ NOUVEAU ENDPOINT - AJOUTE ICI (LIGNE 213)
class CheckRolesRequest(BaseModel):
    username: str

@router.post("/check-roles")
async def check_roles(
    data: CheckRolesRequest,
    db: Session = Depends(get_db)
):
    """Retourner tous les rôles pour cet username"""
    
    users = db.query(User).filter(User.username == data.username).all()
    
    if not users:
        return {"roles": []}
    
    return {
        "roles": [u.role for u in users],
        "email": users[0].email if users else None
    }