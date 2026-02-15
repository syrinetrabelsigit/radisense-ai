"""
Preprocessing Pipeline pour ChestX-ray14
RadiSense AI - Deep Learning Module
Author: Syrine Trabelsi
Date: Février 2026

Ce module gère le preprocessing des radiographies thoraciques :
- Chargement et validation des images
- Redimensionnement à 224x224 (standard pour transfer learning)
- Normalisation avec ImageNet statistics
- Conversions pour PyTorch
"""

import os
import numpy as np
from PIL import Image
import torch
from torchvision import transforms
from typing import Tuple, Optional
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChestXrayPreprocessor:
    """
    Classe pour le preprocessing des radiographies thoraciques.
    
    Attributes:
        image_size (int): Taille de l'image de sortie (224 pour ResNet/DenseNet)
        train_transform (transforms.Compose): Transformations pour l'entraînement
        val_transform (transforms.Compose): Transformations pour validation/test
    """
    
    def __init__(self, image_size: int = 224):
        """
        Initialise le preprocessor.
        
        Args:
            image_size: Taille de l'image de sortie (défaut: 224)
        """
        self.image_size = image_size
        
        # ImageNet statistics (standard pour transfer learning)
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]
        
        # Transformations pour ENTRAÎNEMENT (avec augmentation)
        self.train_transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),  # Flip horizontal (50%)
            transforms.RandomRotation(degrees=10),    # Rotation ±10°
            transforms.ColorJitter(                   # Variation de contraste
                brightness=0.2,
                contrast=0.2
            ),
            transforms.ToTensor(),                    # Conversion en Tensor
            transforms.Normalize(                     # Normalisation
                mean=self.mean,
                std=self.std
            )
        ])
        
        # Transformations pour VALIDATION/TEST (sans augmentation)
        self.val_transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.mean,
                std=self.std
            )
        ])
        
        logger.info(f"✅ Preprocessor initialisé (taille: {image_size}x{image_size})")
    
    def load_image(self, image_path: str) -> Optional[Image.Image]:
        """
        Charge une image depuis un chemin.
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Image PIL en RGB ou None si erreur
        """
        try:
            # Charger l'image en niveaux de gris
            img = Image.open(image_path)
            
            # Convertir en RGB (3 canaux pour ResNet/DenseNet)
            # Les modèles pré-entraînés attendent 3 canaux
            img_rgb = img.convert('RGB')
            
            return img_rgb
            
        except Exception as e:
            logger.error(f"❌ Erreur chargement {image_path}: {e}")
            return None
    
    def preprocess_train(self, image_path: str) -> Optional[torch.Tensor]:
        """
        Prétraite une image pour l'ENTRAÎNEMENT (avec augmentation).
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Tensor PyTorch (C, H, W) ou None si erreur
        """
        img = self.load_image(image_path)
        if img is None:
            return None
        
        try:
            tensor = self.train_transform(img)
            return tensor
        except Exception as e:
            logger.error(f"❌ Erreur preprocessing train {image_path}: {e}")
            return None
    
    def preprocess_val(self, image_path: str) -> Optional[torch.Tensor]:
        """
        Prétraite une image pour VALIDATION/TEST (sans augmentation).
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Tensor PyTorch (C, H, W) ou None si erreur
        """
        img = self.load_image(image_path)
        if img is None:
            return None
        
        try:
            tensor = self.val_transform(img)
            return tensor
        except Exception as e:
            logger.error(f"❌ Erreur preprocessing val {image_path}: {e}")
            return None
    
    def get_image_stats(self, image_path: str) -> dict:
        """
        Obtient les statistiques d'une image.
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Dictionnaire avec width, height, mode, format
        """
        try:
            img = Image.open(image_path)
            return {
                'width': img.width,
                'height': img.height,
                'mode': img.mode,
                'format': img.format,
                'size_bytes': os.path.getsize(image_path)
            }
        except Exception as e:
            logger.error(f"❌ Erreur stats {image_path}: {e}")
            return {}
    
    def denormalize(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Dénormalise un tensor pour visualisation.
        
        Args:
            tensor: Tensor normalisé (C, H, W)
            
        Returns:
            Tensor dénormalisé (C, H, W)
        """
        mean = torch.tensor(self.mean).view(3, 1, 1)
        std = torch.tensor(self.std).view(3, 1, 1)
        return tensor * std + mean


def validate_preprocessing():
    """
    Fonction de validation du preprocessing.
    Teste sur quelques images du dataset.
    """
    print("="*60)
    print("🧪 VALIDATION DU PREPROCESSING")
    print("="*60)
    
    # Créer le preprocessor
    preprocessor = ChestXrayPreprocessor(image_size=224)
    
    # Trouver quelques images de test
    import glob
    test_images = glob.glob("data/raw/images_001/images/*.png")[:5]
    
    if not test_images:
        print("❌ Aucune image trouvée pour validation")
        return
    
    print(f"\n📸 Test sur {len(test_images)} images...\n")
    
    for img_path in test_images:
        # Stats de l'image originale
        stats = preprocessor.get_image_stats(img_path)
        print(f"Image: {os.path.basename(img_path)}")
        print(f"  Original: {stats['width']}x{stats['height']} | {stats['mode']} | {stats['size_bytes']/1024:.1f} KB")
        
        # Test preprocessing train
        tensor_train = preprocessor.preprocess_train(img_path)
        if tensor_train is not None:
            print(f"  Train: {tensor_train.shape} | min={tensor_train.min():.3f} | max={tensor_train.max():.3f}")
        
        # Test preprocessing val
        tensor_val = preprocessor.preprocess_val(img_path)
        if tensor_val is not None:
            print(f"  Val: {tensor_val.shape} | min={tensor_val.min():.3f} | max={tensor_val.max():.3f}")
        
        print()
    
    print("✅ Validation terminée !")
    print("="*60)


if __name__ == "__main__":
    # Exécuter la validation
    validate_preprocessing()