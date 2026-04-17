"""
EfficientNet-B0 pour ChestX-ray14
RadiSense AI
Author: Syrine Trabelsi
"""

import torch
import torch.nn as nn
from torchvision import models


class EfficientNetB0(nn.Module):
    """EfficientNet-B0 pour classification multi-label."""
    
    def __init__(self, num_classes=14, pretrained=True):
        super(EfficientNetB0, self).__init__()
        
        # Charger SANS poids pré-entraînés pour éviter l'erreur
        self.efficientnet = models.efficientnet_b0(weights=None)
        
        if pretrained:
            # Charger les poids manuellement depuis un fichier local
            import urllib.request
            import os
            
            url = "https://download.pytorch.org/models/efficientnet_b0_rwightman-7f5810bc.pth"
            cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
            os.makedirs(cache_dir, exist_ok=True)
            weights_path = os.path.join(cache_dir, "efficientnet_b0_rwightman-7f5810bc.pth")
            
            if not os.path.exists(weights_path):
                print(f"📥 Téléchargement des poids EfficientNet...")
                urllib.request.urlretrieve(url, weights_path)
                print(f"✅ Téléchargement terminé")
            
            state_dict = torch.load(weights_path, map_location='cpu', weights_only=False)
            self.efficientnet.load_state_dict(state_dict)
            print(f"✅ Poids pré-entraînés chargés")
        
        num_features = self.efficientnet.classifier[1].in_features
        self.efficientnet.classifier[1] = nn.Linear(num_features, num_classes)
    
    def forward(self, x):
        return self.efficientnet(x)
    
    @property
    def num_parameters(self):
        return sum(p.numel() for p in self.parameters())


def test_efficientnet():
    print("="*60)
    print("🧪 TEST EFFICIENTNET-B0")
    print("="*60)
    
    model = EfficientNetB0(num_classes=14, pretrained=True)
    print(f"\n✅ Modèle créé")
    print(f"📊 Paramètres: {model.num_parameters:,}")
    
    x = torch.randn(4, 3, 224, 224)
    model.eval()
    with torch.no_grad():
        output = model(x)
    
    print(f"\n🔍 Test: {x.shape} → {output.shape}")
    print(f"\n✅ TEST RÉUSSI !")
    print("="*60)


if __name__ == "__main__":
    test_efficientnet()