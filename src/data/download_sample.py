"""
Script pour télécharger le dataset ChestX-ray14
Source officielle : NIH Clinical Center
"""

import os

def create_data_folders():
    """
    Créer les dossiers nécessaires pour le dataset
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
    ║     TÉLÉCHARGEMENT DATASET CHESTX-RAY14 (NIH)             ║
    ╚════════════════════════════════════════════════════════════╝
    
    📊 SOURCE OFFICIELLE : NIH Clinical Center
    ───────────────────────────────────────────────────
    
    🔗 Lien : https://nihcc.app.box.com/v/ChestXray-NIHCC
    📄 Paper : Wang et al. (2017) - ChestX-ray8
    
    📥 FICHIERS À TÉLÉCHARGER :
    ───────────────────────────────────────────────────
    1. images_001.tar.gz à images_012.tar.gz  (12 fichiers)
    2. Data_Entry_2017.csv                     (Labels)
    3. BBox_List_2017.csv                      (Bounding boxes - optionnel)
    
    📂 STRUCTURE FINALE :
    ───────────────────────────────────────────────────
    data/raw/
    ├── images_001/
    ├── images_002/
    ├── ...
    ├── images_012/
    └── Data_Entry_2017.csv
    
    💡 TOTAL : 112,120 images (~42 GB décompressé)
    
    ✅ Une fois téléchargé, décompresser dans data/raw/
    """)

if __name__ == "__main__":
    print("🚀 Configuration des dossiers de données...\n")
    create_data_folders()
    print("\n")
    show_instructions()