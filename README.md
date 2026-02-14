# 🏥 RadiSense AI

**"Where Radiology Meets Intelligence"**

Plateforme web de diagnostic médical assisté par IA pour la détection automatique de 14 pathologies pulmonaires.

---

## 📋 Informations du Projet

- **Étudiant :** Syrine Trabelsi
- **Professeur :** Haythem Ghazouani
- **Module :** Deep Learning / Computer Vision
- **Durée :** 8 semaines
- **Repository :** [github.com/syrinetrabelsigit/radisense-ai](https://github.com/syrinetrabelsigit/radisense-ai)

---

## 🎯 Objectifs

- ✅ Détection automatique de **14 pathologies pulmonaires**
- ✅ Accuracy > **94%**
- ✅ AUC-ROC > **0.85**
- ✅ Temps d'analyse < **5 secondes**

---

## 📊 Dataset

**ChestX-ray14** (NIH Clinical Center)
- **112,120** radiographies thoraciques
- **1024×1024** pixels (PNG)
- **~42 GB** de données
- **14 pathologies** + Normal

[Télécharger sur Kaggle](https://www.kaggle.com/datasets/nih-chest-xrays/data)

---

## 🤖 5 Modèles à Comparer

| Modèle | Paramètres | AUC-ROC Attendu |
|--------|-----------|----------------|
| **DenseNet-121** ⭐ | 7M | **0.847** |
| ResNet-50 | 25M | 0.839 |
| EfficientNet-B0 | 5M | 0.832 |
| VGG-16 | 138M | 0.821 |
| MobileNet-V2 | 3.5M | 0.815 |

---

## 🛠️ Stack Technique

**Backend & ML:**
- Python 3.11
- PyTorch 2.1
- FastAPI
- MLflow
- MySQL

**Frontend:**
- React 18
- JavaScript
- Tailwind CSS

**DevOps:**
- Docker
- Docker Compose

---

## 📁 Structure du Projet
```
radisense-ai/
├── src/                    # Code source Python
│   ├── data/              # Preprocessing
│   ├── models/            # 5 architectures DL
│   ├── training/          # Training loops
│   ├── api/               # FastAPI
│   └── utils/             # Utilitaires
├── notebooks/             # Jupyter notebooks
├── tests/                 # Tests unitaires
├── docker/                # Docker configs
├── frontend/              # React app
└── data/                  # Dataset (gitignore)
```

---

## 🚀 Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- Docker

### Setup
```bash
# Cloner le repo
git clone https://github.com/syrinetrabelsigit/radisense-ai.git
cd radisense-ai

# Créer venv
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Installer dépendances
pip install -r requirements.txt

# Télécharger dataset
# Voir instructions dans src/data/download_sample.py
```

---

## 📈 Progression

- [x] Setup projet
- [x] Structure complète
- [x] Requirements.txt
- [x] Notebook EDA
- [ ] Téléchargement dataset
- [ ] Preprocessing pipeline
- [ ] Entraînement modèles
- [ ] API FastAPI
- [ ] Frontend React
- [ ] Docker Compose

---

## 📚 Documentation

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Vue d'ensemble complète

---

## 👤 Contact

**Syrine Trabelsi**
- GitHub: [@syrinetrabelsigit](https://github.com/syrinetrabelsigit)
- Prof: h.ghazouani@pi.tn

---

**Date de début :** 6 février 2026  
**Dernière mise à jour :** 14 février 2026