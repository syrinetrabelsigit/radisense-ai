"""
EfficientNet-B0 pour ChestX-ray14
RadiSense AI
Author: Syrine Trabelsi
"""

import torch
import torch.nn as nn
import torchvision.models as models


class EfficientNetB0(nn.Module):
    """EfficientNet-B0 pour classification multi-label."""
    
    def __init__(self, num_classes=14, pretrained=True):
        super(EfficientNetB0, self).__init__()
        
        self.efficientnet = models.efficientnet_b0(pretrained=pretrained)
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