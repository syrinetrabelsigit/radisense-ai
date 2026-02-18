import torch
from PIL import Image
import torchvision.transforms as transforms
from typing import Union
from pathlib import Path
from ..core.config import settings


def preprocess_image(image_path: Union[str, Path]) -> torch.Tensor:
    """
    Preprocess image for DenseNet-121
    Returns: torch.Tensor of shape (1, 3, 224, 224)
    """
    transform = transforms.Compose([
        transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image).unsqueeze(0)
    
    return image_tensor