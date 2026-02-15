"""
DenseNet-121 pour ChestX-ray14
RadiSense AI
Author: Syrine Trabelsi

DenseNet-121 avec transfer learning (pré-entraîné ImageNet).
"""

import torch
import torch.nn as nn
import torchvision.models as models


class DenseNet121(nn.Module):
    """
    DenseNet-121 pour classification multi-label (14 pathologies).
    """
    
    def __init__(self, num_classes=14, pretrained=True):
        """
        Args:
            num_classes: Nombre de classes (14 pathologies)
            pretrained: Utiliser les poids ImageNet
        """
        super(DenseNet121, self).__init__()
        
        # Charger DenseNet-121 pré-entraîné
        self.densenet = models.densenet121(pretrained=pretrained)
        
        # Remplacer le classifier
        num_features = self.densenet.classifier.in_features
        self.densenet.classifier = nn.Linear(num_features, num_classes)
        
    def forward(self, x):
        """
        Forward pass.
        
        Args:
            x: Tensor d'images [batch_size, 3, 224, 224]
        
        Returns:
            Logits [batch_size, 14]
        """
        return self.densenet(x)
    
    @property
    def num_parameters(self):
        """Retourne le nombre de paramètres."""
        return sum(p.numel() for p in self.parameters())


def test_densenet():
    """Test du modèle DenseNet."""
    print("="*60)
    print("🧪 TEST DENSENET-121")
    print("="*60)
    
    # Créer le modèle
    model = DenseNet121(num_classes=14, pretrained=True)
    print(f"\n✅ Modèle créé")
    print(f"📊 Paramètres: {model.num_parameters:,}")
    
    # Test forward pass
    batch_size = 4
    x = torch.randn(batch_size, 3, 224, 224)
    
    model.eval()
    with torch.no_grad():
        output = model(x)
    
    print(f"\n🔍 Test forward pass:")
    print(f"  Input shape: {x.shape}")
    print(f"  Output shape: {output.shape}")
    print(f"  Output range: [{output.min():.3f}, {output.max():.3f}]")
    
    # Test avec sigmoid (pour prédictions)
    probs = torch.sigmoid(output)
    print(f"\n  Probabilités (après sigmoid):")
    print(f"    Range: [{probs.min():.3f}, {probs.max():.3f}]")
    print(f"    Premier échantillon: {probs[0][:5].tolist()}")
    
    print(f"\n✅ TEST RÉUSSI !")
    print("="*60)


if __name__ == "__main__":
    test_densenet()