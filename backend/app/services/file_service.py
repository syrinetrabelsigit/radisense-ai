import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import UploadFile
import uuid

class FileService:
    def __init__(self):
        self.base_upload_dir = Path("uploads")
        self.base_upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.avatars_dir = self.base_upload_dir / "avatars"
        self.xrays_dir = self.base_upload_dir / "xrays"
        self.heatmaps_dir = self.base_upload_dir / "heatmaps"
        self.reports_dir = self.base_upload_dir / "reports"
        
        for directory in [self.avatars_dir, self.xrays_dir, self.heatmaps_dir, self.reports_dir]:
            directory.mkdir(exist_ok=True)
    
    async def save_avatar(self, file: UploadFile, user_id: int) -> str:
        """Save user avatar image"""
        file_extension = file.filename.split('.')[-1]
        filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = self.avatars_dir / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return str(file_path)
    
    async def save_xray(self, file: UploadFile, user_id: int) -> str:
        """Save X-ray image"""
        file_extension = file.filename.split('.')[-1]
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"xray_{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = self.xrays_dir / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return str(file_path)
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes"""
        try:
            return Path(file_path).stat().st_size
        except:
            return 0

file_service = FileService()