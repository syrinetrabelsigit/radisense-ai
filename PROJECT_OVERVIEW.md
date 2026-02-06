# RadiSense AI - Vue d'ensemble du projet

## Objectifs

1. Détection automatique de 14 pathologies pulmonaires
2. Temps d'analyse < 5 secondes
3. Précision > 94%
4. AUC-ROC > 0.85

## Dataset

**ChestX-ray14** (NIH)
- 112,120 images
- 14 pathologies + Normal

## Architecture

- Backend : FastAPI + PyTorch
- Frontend : React + Tailwind
- Database : MySQL
- MLOps : MLflow + Docker

## 5 Modèles à comparer

1. DenseNet-121 
2. ResNet-50
3. EfficientNet-B0
4. VGG-16
5. MobileNet-V2