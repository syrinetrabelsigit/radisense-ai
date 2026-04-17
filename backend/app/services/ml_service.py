import torch
import numpy as np
from PIL import Image
from pathlib import Path
import time
from typing import Dict, List, Optional
import sys

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

try:
    from backend.app.utils.preprocessing import preprocess_image
    from backend.app.utils.gradcam import GradCAM, get_target_layer
    from src.models.densenet import DenseNet121
    from src.models.resnet import ResNet50
    from src.models.efficientnet import EfficientNetB0
    from src.models.mobilenet import MobileNetV2
except ImportError:
    from app.utils.preprocessing import preprocess_image
    from app.utils.gradcam import GradCAM, get_target_layer
    try:
        from src.models.densenet import DenseNet121
        from src.models.resnet import ResNet50
        from src.models.efficientnet import EfficientNetB0
        from src.models.mobilenet import MobileNetV2
    except ImportError:
        DenseNet121 = ResNet50 = EfficientNetB0 = MobileNetV2 = None

class MLService:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.pathologies = [
            'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration',
            'Mass', 'Nodule', 'Pneumonia', 'Pneumothorax',
            'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
            'Pleural_Thickening', 'Hernia'
        ]
        
        # Models paths
        self.models_dir = Path(__file__).parent.parent.parent.parent / "models"
        
    def load_model(self, model_name: str):
        """Load a specific model"""
        if model_name in self.models:
            return self.models[model_name]
        
        models_dict = {
            'densenet': (DenseNet121, 'densenet_best.pth'),
            'resnet': (ResNet50, 'resnet_best.pth'),
            'efficientnet': (EfficientNetB0, 'efficientnet_best.pth'),
            'mobilenet': (MobileNetV2, 'mobilenet_best.pth')
        }
        
        if model_name not in models_dict:
            raise ValueError(f"Model {model_name} not supported")
        
        model_class, weights_file = models_dict[model_name]
        weights_path = self.models_dir / weights_file
        
        if not weights_path.exists():
            raise FileNotFoundError(f"Model weights not found: {weights_path}")
        
        # Load model
        model = model_class(num_classes=14, pretrained=False)
        checkpoint = torch.load(weights_path, map_location=self.device)
        model.load_state_dict(checkpoint)
        model.to(self.device)
        model.eval()
        
        self.models[model_name] = model
        return model
    
    async def predict(self, image_path: str, model_name: str = 'mobilenet') -> Dict:
        """
        Make prediction on X-ray image
        
        Args:
            image_path: Path to the X-ray image
            model_name: Model to use (mobilenet, densenet, resnet, efficientnet)
            
        Returns:
            Dictionary with predictions, confidence scores, and metadata
        """
        start_time = time.time()
        
        # Load model
        model = self.load_model(model_name)
        
        # Preprocess image
        image_tensor = preprocess_image(image_path)
        image_tensor = image_tensor.unsqueeze(0).to(self.device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.sigmoid(outputs).cpu().numpy()[0]
        
        # Get predictions above threshold
        threshold = 0.10
        predictions = []
        confidence_scores = {}
        
        print(f"\n=== PROBABILITIES FROM {model_name} ===")
        for i, prob in enumerate(probabilities):
            pathology = self.pathologies[i]
            confidence_scores[pathology] = float(prob)
            print(f"  {pathology}: {prob:.4f}")
            
            if prob > threshold:
                predictions.append(pathology)
        
        print(f"=== PREDICTIONS (>0.5): {predictions} ===\n")
        
        # Sort by confidence
        predictions = sorted(predictions, key=lambda x: confidence_scores[x], reverse=True)
        
        processing_time = time.time() - start_time
        
        return {
            'predictions': predictions,
            'confidence_scores': confidence_scores,
            'processing_time': round(processing_time, 3),
            'model_used': model_name,
            'device': str(self.device)
        }
    
    async def predict_with_gradcam(
        self, 
        image_path: str, 
        model_name: str = 'mobilenet',
        top_k: int = 3
    ) -> Dict:
        """
        Make prediction with Grad-CAM heatmaps
        
        Args:
            image_path: Path to the X-ray image
            model_name: Model to use
            top_k: Number of top predictions to generate heatmaps for
            
        Returns:
            Dictionary with predictions and heatmaps
        """
        start_time = time.time()
        
        # Load model
        model = self.load_model(model_name)
        
        # Load original image
        original_image = Image.open(image_path).convert('RGB')
        
        # Preprocess image
        image_tensor = preprocess_image(image_path)
        image_tensor = image_tensor.unsqueeze(0).to(self.device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.sigmoid(outputs).cpu().numpy()[0]
        
        # Get top-k predictions
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        predictions = []
        heatmaps = {}
        
        # Generate Grad-CAM for top predictions
        target_layer = get_target_layer(model, model_name)
        grad_cam = GradCAM(model, target_layer)
        
        for idx in top_indices:
            pathology = self.pathologies[idx]
            confidence = float(probabilities[idx])
            
            predictions.append({
                'pathology': pathology,
                'confidence': confidence
            })
            
            # Generate heatmap
            try:
                result_image, cam = grad_cam.visualize(
                    image_tensor,
                    original_image,
                    class_idx=idx
                )
                
                # Convert to base64
                import io
                import base64
                buffered = io.BytesIO()
                result_image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                heatmaps[pathology] = img_str
                
            except Exception as e:
                print(f"Error generating heatmap for {pathology}: {e}")
                heatmaps[pathology] = None
        
        processing_time = time.time() - start_time
        
        return {
            'predictions': predictions,
            'heatmaps': heatmaps,
            'processing_time': round(processing_time, 3),
            'model_used': model_name,
            'device': str(self.device)
        }
    
    async def compare_models(self, image_path: str) -> Dict:
        """
        Compare predictions from all 4 models
        
        Args:
            image_path: Path to the X-ray image
            
        Returns:
            Dictionary with results from all models
        """
        results = {}
        
        for model_name in ['mobilenet', 'densenet', 'resnet', 'efficientnet']:
            try:
                result = await self.predict(image_path, model_name)
                results[model_name] = result
            except Exception as e:
                print(f"Error with {model_name}: {e}")
                results[model_name] = {'error': str(e)}
        
        return results