"""
Script pour télécharger un échantillon du dataset ChestX-ray14
"""

import os

def create_data_folders():
    """
    Créer les dossiers nécessaires
    """
    folders = [
        "data/raw/images",
        "data/processed",
        "data/splits"
    ]
    
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
        print(f"✅ Dossier créé: {folder}")

def show_instructions():
    """
    Affiche les instructions pour télécharger le dataset
    """
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║        TÉLÉCHARGEMENT DATASET CHESTX-RAY14                ║
    ╚════════════════════════════════════════════════════════════╝
    
    📊 OPTION 1 : Kaggle (RECOMMANDÉ - plus facile)
    ───────────────────────────────────────────────────
    1. Va sur : https://www.kaggle.com/datasets/nih-chest-xrays/data
    2. Connecte-toi (gratuit)
    3. Clique "Download" (6.3 GB - version réduite)
    4. Décompresse dans : data/raw/
    
    📊 OPTION 2 : NIH (Dataset complet - 42 GB)
    ───────────────────────────────────────────────────
    1. Va sur : https://nihcc.app.box.com/v/ChestXray-NIHCC
    2. Télécharge images_001.tar.gz à images_012.tar.gz
    3. Télécharge Data_Entry_2017.csv
    4. Mets tout dans : data/raw/
    
    📊 OPTION 3 : Pour tester MAINTENANT (100 images)
    ───────────────────────────────────────────────────
    On va coder sans dataset d'abord, puis télécharger plus tard !
    
    ✅ Pour l'instant, on continue avec le notebook EDA !
    """)

if __name__ == "__main__":
    print("🚀 Configuration des dossiers de données...\n")
    create_data_folders()
    print("\n")
    show_instructions()