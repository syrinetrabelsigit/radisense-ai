"""
VGG-16 pour ChestX-ray14
RadiSense AI
Author: Syrine Trabelsi
"""

import torch
import torch.nn as nn
import torchvision.models as models


class VGG16(nn.Module):
    """VGG-16 pour classification multi-label."""
    
    def __init__(self, num_classes=14, pretrained=True):
        super(VGG16, self).__init__()
        
        self.vgg = models.vgg16(pretrained=pretrained)
        num_features = self.vgg.classifier[6].in_features
        self.vgg.classifier[6] = nn.Linear(num_features, num_classes)
    
    def forward(self, x):
        return self.vgg(x)
    
    @property
    def num_parameters(self):
        return sum(p.numel() for p in self.parameters())


def test_vgg():
    print("="*60)
    print("🧪 TEST VGG-16")
    print("="*60)
    
    model = VGG16(num_classes=14, pretrained=True)
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
    test_vgg()