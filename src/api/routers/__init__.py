from .auth import router as auth_router
from .predict import router as predict_router
from .patients import router as patients_router
from .users import router as users_router          
from .analytics import router as analytics_router  
from .admin import router as admin_router          

__all__ = [
    "auth_router",
    "predict_router",
    "patients_router",
    "users_router",        
    "analytics_router",    
    "admin_router"         
]