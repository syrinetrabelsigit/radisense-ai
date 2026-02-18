import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional
import timm
from ..core.config import settings


class ModelLoader:
    _instance: Optional['ModelLoader'] = None
    _model: Optional[nn.Module] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_model(self, model_path: Optional[str] = None) -> nn.Module:
        if self._model is not None:
            return self._model
        
        if model_path is None:
            model_path = Path(settings.MODEL_DIR) / settings.DEFAULT_MODEL
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load DenseNet-121
        model = timm.create_model('densenet121', pretrained=False, num_classes=14)
        
        if Path(model_path).exists():
            checkpoint = torch.load(model_path, map_location=device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            else:
                model.load_state_dict(checkpoint)
            print(f"✅ Model loaded from {model_path}")
        else:
            print(f"⚠️  Model file not found: {model_path}")
            print("🔄 Using untrained model for testing")
        
        model = model.to(device)
        model.eval()
        
        self._model = model
        return model
    
    def get_model(self) -> nn.Module:
        if self._model is None:
            return self.load_model()
        return self._model
    
    @property
    def device(self) -> torch.device:
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Singleton instance
model_loader = ModelLoader()