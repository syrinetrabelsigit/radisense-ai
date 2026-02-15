"""
ResNet-50 pour ChestX-ray14
RadiSense AI
Author: Syrine Trabelsi
"""

import torch
import torch.nn as nn
import torchvision.models as models


class ResNet50(nn.Module):
    """ResNet-50 pour classification multi-label."""
    
    def __init__(self, num_classes=14, pretrained=True):
        super(ResNet50, self).__init__()
        
        self.resnet = models.resnet50(pretrained=pretrained)
        num_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(num_features, num_classes)
    
    def forward(self, x):
        return self.resnet(x)
    
    @property
    def num_parameters(self):
        return sum(p.numel() for p in self.parameters())


def test_resnet():
    print("="*60)
    print("🧪 TEST RESNET-50")
    print("="*60)
    
    model = ResNet50(num_classes=14, pretrained=True)
    print(f"\n✅ Modèle créé")
    print(f"📊 Paramètres: {model.num_parameters:,}")
    
    x = torch.randn(4, 3, 224, 224)
    model.eval()
    with torch.no_grad():
        output = model(x)
    
    print(f"\n🔍 Test forward pass:")
    print(f"  Input: {x.shape}")
    print(f"  Output: {output.shape}")
    print(f"\n✅ TEST RÉUSSI !")
    print("="*60)


if __name__ == "__main__":
    test_resnet()