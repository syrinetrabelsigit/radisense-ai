# 🏥 RadiSense AI
**"Where Radiology Meets Intelligence"**

Plateforme web de diagnostic médical assisté par IA pour la détection automatique de 14 pathologies pulmonaires.

---

## 📋 Informations du Projet

- **Étudiante :** Syrine Trabelsi
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

## 🤖 5 Modèles Comparés

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
- Python 3.11 + PyTorch 2.1
- FastAPI + SQLAlchemy
- MLflow (experiment tracking)
- MySQL 8.0

**Frontend:**
- React 18 + JavaScript
- Tailwind CSS

**DevOps:**
- Docker + Docker Compose
- pytest (71% coverage)

---

## 📁 Structure du Projet
radisense-ai/
├── backend/                # API FastAPI
│   ├── app/
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── tests/             # Tests pytest (71% coverage)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React App
│   ├── src/
│   └── Dockerfile
├── notebooks/             # Jupyter notebooks
│   ├── 01_EDA.ipynb
│   ├── 02_Training.ipynb
│   └── 03_Evaluation.ipynb
├── docker-compose.yml
└── README.md
---

## 🚀 Lancer le Projet avec Docker

### Prérequis
- Docker Desktop installé et lancé
- Git

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/syrinetrabelsigit/radisense-ai.git
cd radisense-ai

# 2. Lancer tous les services
docker-compose up --build
```

### Services disponibles

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface React |
| Backend API | http://localhost:8000 | FastAPI + Swagger |
| API Docs | http://localhost:8000/docs | Documentation Swagger |
| MLflow | http://localhost:5000 | Experiment tracking |
| MySQL | localhost:3307 | Base de données |

### Arrêter les services

```bash
docker-compose down
```

---

## 🧪 Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

**Résultats :** 171 tests passent — coverage **71.37%** ✅

---

## 🔧 Installation Manuelle (sans Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Variables d'environnement

Créer `backend/.env` :
```env
DATABASE_URL=mysql+pymysql://root:radisense_password@localhost:3307/radisense
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📈 Progression

- [x] Setup projet & structure
- [x] Dataset EDA (Notebook 01)
- [x] Preprocessing pipeline
- [x] Entraînement modèles (Notebook 02)
- [x] Évaluation & comparaison (Notebook 03)
- [x] Backend FastAPI complet
- [x] Frontend React complet
- [x] Docker Compose (4 services)
- [x] Tests pytest (71% coverage)
- [x] MLflow tracking

---

## 👤 Contact

**Syrine Trabelsi**
- GitHub: [@syrinetrabelsigit](https://github.com/syrinetrabelsigit)
- Prof: h.ghazouani@pi.tn

---

**Date de début :** 16 Janvier 2026
**Dernière mise à jour :** 18 avril 2026