"""
Grad-CAM Implementation pour RadiSense AI
Author: Syrine Trabelsi

Grad-CAM (Gradient-weighted Class Activation Mapping) permet de visualiser
les zones importantes de l'image utilisées par le modèle pour ses prédictions.
"""

import torch
import torch.nn.functional as F
import numpy as np
import cv2
import matplotlib.pyplot as plt
from PIL import Image


class GradCAM:
    """
    Implémentation de Grad-CAM pour visualiser les activations du modèle.
    
    Référence: Selvaraju et al. "Grad-CAM: Visual Explanations from Deep Networks
    via Gradient-based Localization" (2017)
    """
    
    def __init__(self, model, target_layer):
        """
        Args:
            model: Modèle PyTorch
            target_layer: Couche cible pour Grad-CAM (dernière conv layer)
        """
        self.model = model
        self.target_layer = target_layer
        
        self.gradients = None
        self.activations = None
        
        # Hooks pour capturer gradients et activations
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)
    
    def save_activation(self, module, input, output):
        """Hook pour sauvegarder les activations."""
        self.activations = output.detach()
    
    def save_gradient(self, module, grad_input, grad_output):
        """Hook pour sauvegarder les gradients."""
        self.gradients = grad_output[0].detach()
    
    def generate_cam(self, input_image, class_idx=None):
        """
        Génère la carte d'activation pour une classe spécifique.
        
        Args:
            input_image: Tensor [1, 3, H, W]
            class_idx: Index de la classe (None pour la classe prédite)
        
        Returns:
            cam: Carte d'activation normalisée [H, W]
        """
        # Forward pass
        self.model.eval()
        output = self.model(input_image)
        
        # Si pas de classe spécifiée, prendre celle avec le score max
        if class_idx is None:
            class_idx = output.argmax(dim=1).item()
        
        # Backward sur la classe cible
        self.model.zero_grad()
        target = output[:, class_idx]
        target.backward()
        
        # Grad-CAM
        gradients = self.gradients[0]  # [C, H', W']
        activations = self.activations[0]  # [C, H', W']
        
        # Global Average Pooling des gradients
        weights = gradients.mean(dim=(1, 2))  # [C]
        
        # Weighted combination
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        
        # ReLU
        cam = F.relu(cam)
        
        # Normaliser entre 0 et 1
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        
        return cam.cpu().numpy()
    
    def visualize(
        self,
        input_image,
        original_image,
        class_idx=None,
        alpha=0.5,
        colormap=cv2.COLORMAP_JET
    ):
        """
        Visualise Grad-CAM superposé sur l'image originale.
        
        Args:
            input_image: Tensor normalisé [1, 3, H, W]
            original_image: Image PIL ou array numpy
            class_idx: Index de classe
            alpha: Transparence de la heatmap
            colormap: Colormap OpenCV
        
        Returns:
            result: Image avec heatmap superposée
        """
        # Générer CAM
        cam = self.generate_cam(input_image, class_idx)
        
        # Convertir l'image originale
        if isinstance(original_image, Image.Image):
            original_image = np.array(original_image)
        
        # Resize CAM à la taille de l'image originale
        h, w = original_image.shape[:2]
        cam_resized = cv2.resize(cam, (w, h))
        
        # Convertir CAM en heatmap
        heatmap = cv2.applyColorMap(
            np.uint8(255 * cam_resized),
            colormap
        )
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Superposer
        result = heatmap * alpha + original_image * (1 - alpha)
        result = np.uint8(result)
        
        return result, cam_resized


def get_target_layer(model, model_name):
    """
    Retourne la dernière couche de convolution pour chaque architecture.
    
    Args:
        model: Modèle PyTorch
        model_name: Nom du modèle (densenet, resnet, efficientnet, mobilenet)
    
    Returns:
        target_layer: Dernière couche de convolution
    """
    if model_name == 'densenet':
        return model.densenet.features[-1]
    elif model_name == 'resnet':
        return model.resnet.layer4[-1]
    elif model_name == 'efficientnet':
        return model.efficientnet.features[-1]
    elif model_name == 'mobilenet':
        return model.mobilenet.features[-1]
    else:
        raise ValueError(f"Modèle inconnu: {model_name}")


def visualize_prediction(
    model,
    model_name,
    image_tensor,
    original_image,
    pathologies,
    top_k=3
):
    """
    Visualise les prédictions avec Grad-CAM pour les top-k pathologies.
    
    Args:
        model: Modèle PyTorch
        model_name: Nom du modèle
        image_tensor: Tensor [1, 3, H, W]
        original_image: Image PIL
        pathologies: Liste des noms de pathologies
        top_k: Nombre de pathologies à visualiser
    
    Returns:
        fig: Figure matplotlib
    """
    # Obtenir la couche cible
    target_layer = get_target_layer(model, model_name)
    
    # Créer Grad-CAM
    grad_cam = GradCAM(model, target_layer)
    
    # Prédiction
    model.eval()
    with torch.no_grad():
        output = model(image_tensor)
        probs = torch.sigmoid(output)[0]
    
    # Top-k pathologies
    top_probs, top_indices = torch.topk(probs, top_k)
    
    # Visualisation
    fig, axes = plt.subplots(1, top_k + 1, figsize=(4 * (top_k + 1), 4))
    
    # Image originale
    axes[0].imshow(original_image)
    axes[0].set_title('Image Originale', fontweight='bold')
    axes[0].axis('off')
    
    # Grad-CAM pour chaque pathologie
    for i, (prob, idx) in enumerate(zip(top_probs, top_indices)):
        result, _ = grad_cam.visualize(
            image_tensor,
            original_image,
            class_idx=idx.item()
        )
        
        axes[i + 1].imshow(result)
        axes[i + 1].set_title(
            f'{pathologies[idx.item()]}\n{prob.item():.1%}',
            fontweight='bold'
        )
        axes[i + 1].axis('off')
    
    plt.tight_layout()
    return fig


# Test de la classe
if __name__ == "__main__":
    print("="*60)
    print("🔥 TEST GRAD-CAM")
    print("="*60)
    print("\n✅ Module Grad-CAM créé avec succès !")
    print("\nFonctions disponibles :")
    print("  • GradCAM: Classe principale")
    print("  • get_target_layer: Obtenir la couche cible")
    print("  • visualize_prediction: Visualiser les prédictions")
    print("="*60)