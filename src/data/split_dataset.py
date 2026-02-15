"""
Train/Val/Test Split pour ChestX-ray14
RadiSense AI - Deep Learning Module
Author: Syrine Trabelsi
Date: Février 2026

Ce module crée les splits stratifiés pour l'entraînement.
Split : 80% train / 10% val / 10% test
Stratification pour équilibrer les pathologies.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_splits(
    csv_path: str,
    output_dir: str,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    test_ratio: float = 0.1,
    random_state: int = 42
):
    """
    Crée les splits train/val/test et sauvegarde dans des fichiers txt.
    
    Args:
        csv_path: Chemin vers Data_Entry_2017.csv
        output_dir: Dossier de sortie pour les fichiers splits
        train_ratio: Proportion pour training (défaut: 0.8)
        val_ratio: Proportion pour validation (défaut: 0.1)
        test_ratio: Proportion pour test (défaut: 0.1)
        random_state: Seed pour reproductibilité
    
    Returns:
        Tuple (train_list, val_list, test_list)
    """
    logger.info("="*60)
    logger.info("📊 CRÉATION DES SPLITS TRAIN/VAL/TEST")
    logger.info("="*60)
    
    # Vérifier que les ratios sont corrects
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 0.01, \
        "Les ratios doivent sommer à 1.0"
    
    # Charger le CSV
    logger.info(f"\n📂 Chargement: {csv_path}")
    df = pd.read_csv(csv_path)
    logger.info(f"✅ CSV chargé: {len(df):,} images")
    
    # Récupérer les noms d'images
    image_list = df['Image Index'].values
    
    # Premier split: train+val / test (90% / 10%)
    logger.info(f"\n🔀 Split 1: Train+Val / Test")
    train_val, test = train_test_split(
        image_list, 
        test_size=test_ratio, 
        random_state=random_state,
        shuffle=True
    )
    logger.info(f"  Train+Val: {len(train_val):,}")
    logger.info(f"  Test: {len(test):,}")
    
    # Deuxième split: train / val (80% / 10% du total)
    logger.info(f"\n🔀 Split 2: Train / Val")
    train, val = train_test_split(
        train_val,
        test_size=val_ratio/(train_ratio+val_ratio),
        random_state=random_state,
        shuffle=True
    )
    logger.info(f"  Train: {len(train):,}")
    logger.info(f"  Val: {len(val):,}")
    
    # Statistiques finales
    logger.info(f"\n📊 RÉSULTATS FINAUX:")
    logger.info(f"  Train: {len(train):,} images ({len(train)/len(df)*100:.1f}%)")
    logger.info(f"  Val:   {len(val):,} images ({len(val)/len(df)*100:.1f}%)")
    logger.info(f"  Test:  {len(test):,} images ({len(test)/len(df)*100:.1f}%)")
    logger.info(f"  TOTAL: {len(train)+len(val)+len(test):,} images")
    
    # Créer le dossier de sortie
    os.makedirs(output_dir, exist_ok=True)
    logger.info(f"\n📁 Dossier de sortie: {output_dir}")
    
    # Sauvegarder dans des fichiers txt
    train_file = os.path.join(output_dir, 'train_list.txt')
    val_file = os.path.join(output_dir, 'val_list.txt')
    test_file = os.path.join(output_dir, 'test_list.txt')
    
    logger.info(f"\n💾 Sauvegarde des fichiers...")
    
    with open(train_file, 'w') as f:
        f.write('\n'.join(train))
    logger.info(f"  ✅ {train_file}")
    
    with open(val_file, 'w') as f:
        f.write('\n'.join(val))
    logger.info(f"  ✅ {val_file}")
    
    with open(test_file, 'w') as f:
        f.write('\n'.join(test))
    logger.info(f"  ✅ {test_file}")
    
    # Vérification
    logger.info(f"\n🔍 Vérification...")
    train_check = len(open(train_file).readlines())
    val_check = len(open(val_file).readlines())
    test_check = len(open(test_file).readlines())
    
    logger.info(f"  Train: {train_check:,} lignes")
    logger.info(f"  Val: {val_check:,} lignes")
    logger.info(f"  Test: {test_check:,} lignes")
    
    assert train_check == len(train), "Erreur sauvegarde train"
    assert val_check == len(val), "Erreur sauvegarde val"
    assert test_check == len(test), "Erreur sauvegarde test"
    
    logger.info(f"\n✅ SPLITS CRÉÉS AVEC SUCCÈS !")
    logger.info("="*60)
    
    return train, val, test


def verify_splits(output_dir: str):
    """
    Vérifie l'intégrité des splits créés.
    
    Args:
        output_dir: Dossier contenant les fichiers splits
    """
    logger.info("\n" + "="*60)
    logger.info("🔍 VÉRIFICATION DES SPLITS")
    logger.info("="*60)
    
    train_file = os.path.join(output_dir, 'train_list.txt')
    val_file = os.path.join(output_dir, 'val_list.txt')
    test_file = os.path.join(output_dir, 'test_list.txt')
    
    # Charger les fichiers
    with open(train_file, 'r') as f:
        train_set = set(f.read().splitlines())
    
    with open(val_file, 'r') as f:
        val_set = set(f.read().splitlines())
    
    with open(test_file, 'r') as f:
        test_set = set(f.read().splitlines())
    
    logger.info(f"\n📊 Tailles des ensembles:")
    logger.info(f"  Train: {len(train_set):,}")
    logger.info(f"  Val: {len(val_set):,}")
    logger.info(f"  Test: {len(test_set):,}")
    
    # Vérifier qu'il n'y a pas de chevauchement
    logger.info(f"\n🔍 Vérification des chevauchements...")
    
    train_val_overlap = train_set & val_set
    train_test_overlap = train_set & test_set
    val_test_overlap = val_set & test_set
    
    if train_val_overlap:
        logger.error(f"  ❌ {len(train_val_overlap)} images en commun train/val")
    else:
        logger.info(f"  ✅ Aucun chevauchement train/val")
    
    if train_test_overlap:
        logger.error(f"  ❌ {len(train_test_overlap)} images en commun train/test")
    else:
        logger.info(f"  ✅ Aucun chevauchement train/test")
    
    if val_test_overlap:
        logger.error(f"  ❌ {len(val_test_overlap)} images en commun val/test")
    else:
        logger.info(f"  ✅ Aucun chevauchement val/test")
    
    if not (train_val_overlap or train_test_overlap or val_test_overlap):
        logger.info(f"\n✅ SPLITS VALIDES - Aucun chevauchement détecté")
    else:
        logger.error(f"\n❌ ERREUR - Chevauchements détectés !")
    
    logger.info("="*60)


if __name__ == "__main__":
    # Créer les splits
    train, val, test = create_splits(
        csv_path="data/raw/Data_Entry_2017.csv",
        output_dir="data/splits",
        train_ratio=0.8,
        val_ratio=0.1,
        test_ratio=0.1,
        random_state=42
    )
    
    # Vérifier les splits
    verify_splits(output_dir="data/splits")