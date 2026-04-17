import torch
from torchvision import transforms
from PIL import Image

def preprocess_image(image_path: str) -> torch.Tensor:
    """
    Preprocess image for model inference
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Preprocessed image tensor (C, H, W)
    """
    # Load image
    image = Image.open(image_path).convert('RGB')
    
    # Define preprocessing transforms
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # Apply transforms
    image_tensor = transform(image)
    
    # Return tensor WITHOUT adding batch dimension (ml_service will do it)
    return image_tensor