"""
Data Cleaning pour ChestX-ray14
RadiSense AI - Deep Learning Module
Author: Syrine Trabelsi
Date: Février 2026

Nettoyage du dataset :
- Vérification images existantes
- Suppression labels incohérents
- Suppression duplicatas patients
"""

import pandas as pd
import os
import glob
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_images_exist(df, image_root):
    """
    Vérifie que toutes les images du CSV existent réellement.
    
    Args:
        df: DataFrame avec colonne 'Image Index'
        image_root: Racine du dossier images
    
    Returns:
        DataFrame filtré avec seulement les images existantes
    """
    logger.info("🔍 Vérification existence des images...")
    
    valid_indices = []
    image_folders = sorted(glob.glob(os.path.join(image_root, "images_*")))
    
    for idx, row in df.iterrows():
        img_name = row['Image Index']
        found = False
        
        for folder in image_folders:
            img_path = os.path.join(folder, "images", img_name)
            if os.path.exists(img_path):
                found = True
                break
        
        if found:
            valid_indices.append(idx)
    
    df_valid = df.loc[valid_indices].copy()
    
    logger.info(f"  Avant: {len(df):,} images")
    logger.info(f"  Après: {len(df_valid):,} images")
    logger.info(f"  ❌ Supprimées: {len(df) - len(df_valid):,}")
    
    return df_valid


def remove_inconsistent_labels(df):
    """
    Retire les labels incohérents (No Finding + autres pathologies).
    
    Args:
        df: DataFrame avec colonne 'Finding Labels'
    
    Returns:
        DataFrame nettoyé
    """
    logger.info("🧹 Nettoyage labels incohérents...")
    
    before = len(df)
    
    # Retirer "No Finding|Pathology" (incohérent)
    mask = (df['Finding Labels'].str.contains('No Finding')) & \
           (df['Finding Labels'].str.contains('\|'))
    
    df_clean = df[~mask].copy()
    
    logger.info(f"  ❌ Supprimées: {before - len(df_clean):,}")
    
    return df_clean


def remove_duplicates(df):
    """
    Retire les duplicatas (même patient, plusieurs scans).
    Garde la première image de chaque patient.
    
    Args:
        df: DataFrame avec colonne 'Patient ID'
    
    Returns:
        DataFrame sans duplicatas
    """
    logger.info("🗑️  Suppression duplicatas patients...")
    
    before = len(df)
    df_unique = df.drop_duplicates(subset=['Patient ID'], keep='first').copy()
    
    logger.info(f"  ❌ Supprimées: {before - len(df_unique):,}")
    
    return df_unique


def clean_dataset(
    input_csv: str,
    image_root: str,
    output_csv: str
):
    """
    Pipeline complet de nettoyage.
    
    Args:
        input_csv: Chemin du CSV original
        image_root: Dossier racine des images
        output_csv: Chemin du CSV nettoyé
    """
    logger.info("="*60)
    logger.info("🧹 NETTOYAGE DU DATASET CHESTX-RAY14")
    logger.info("="*60)
    
    # Charger le CSV
    logger.info(f"\n📂 Chargement: {input_csv}")
    df = pd.read_csv(input_csv)
    logger.info(f"✅ Chargé: {len(df):,} entrées")
    
    # Étape 1: Vérifier images
    df = verify_images_exist(df, image_root)
    
    # Étape 2: Labels incohérents
    df = remove_inconsistent_labels(df)
    
    # Étape 3: Duplicatas
    df = remove_duplicates(df)
    
    # Sauvegarder
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    
    logger.info(f"\n💾 Dataset nettoyé sauvegardé: {output_csv}")
    logger.info(f"📊 RÉSULTAT FINAL: {len(df):,} images")
    logger.info(f"📉 Réduction: {(1 - len(df)/112120)*100:.1f}%")
    logger.info("="*60)
    
    return df


if __name__ == "__main__":
    # Chemins
    input_csv = "data/raw/Data_Entry_2017.csv"
    image_root = "data/raw"
    output_csv = "data/cleaned/Data_Entry_2017_clean.csv"
    
    # Nettoyer
    df_clean = clean_dataset(input_csv, image_root, output_csv)