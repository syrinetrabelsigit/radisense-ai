"""
DataLoaders pour ChestX-ray14
RadiSense AI - Deep Learning Module
Author: Syrine Trabelsi
Date: Février 2026

Ce module crée les DataLoaders PyTorch pour train/val/test.
"""

import os
import torch
from torch.utils.data import DataLoader
from dataset import ChestXrayDataset
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_dataloaders(
    csv_path: str,
    image_root: str,
    splits_dir: str,
    batch_size: int = 32,
    num_workers: int = 4,
    image_size: int = 224
):
    """
    Crée les DataLoaders pour train, val et test.
    
    Args:
        csv_path: Chemin vers Data_Entry_2017.csv
        image_root: Dossier racine des images
        splits_dir: Dossier contenant train/val/test_list.txt
        batch_size: Taille du batch (défaut: 32)
        num_workers: Nombre de workers pour chargement (défaut: 4)
        image_size: Taille des images (défaut: 224)
    
    Returns:
        Tuple (train_loader, val_loader, test_loader)
    """
    logger.info("="*60)
    logger.info("🔄 CRÉATION DES DATALOADERS")
    logger.info("="*60)
    
    # Créer les datasets
    logger.info(f"\n📂 Création des datasets...")
    
    train_dataset = ChestXrayDataset(
        csv_path=csv_path,
        image_root=image_root,
        mode='train',
        image_size=image_size
    )
    
    val_dataset = ChestXrayDataset(
        csv_path=csv_path,
        image_root=image_root,
        mode='val',
        image_size=image_size
    )
    
    test_dataset = ChestXrayDataset(
        csv_path=csv_path,
        image_root=image_root,
        mode='test',
        image_size=image_size
    )
    
    # Filtrer selon les splits
    logger.info(f"\n🔍 Filtrage selon les splits...")
    
    # Charger les listes
    train_list = set(open(os.path.join(splits_dir, 'train_list.txt')).read().splitlines())
    val_list = set(open(os.path.join(splits_dir, 'val_list.txt')).read().splitlines())
    test_list = set(open(os.path.join(splits_dir, 'test_list.txt')).read().splitlines())
    
    # Filtrer les datasets
    train_dataset.df = train_dataset.df[train_dataset.df['Image Index'].isin(train_list)]
    val_dataset.df = val_dataset.df[val_dataset.df['Image Index'].isin(val_list)]
    test_dataset.df = test_dataset.df[test_dataset.df['Image Index'].isin(test_list)]
    
    logger.info(f"  Train: {len(train_dataset):,} images")
    logger.info(f"  Val: {len(val_dataset):,} images")
    logger.info(f"  Test: {len(test_dataset):,} images")
    
    # Créer les DataLoaders
    logger.info(f"\n⚙️  Configuration DataLoaders:")
    logger.info(f"  Batch size: {batch_size}")
    logger.info(f"  Num workers: {num_workers}")
    logger.info(f"  Image size: {image_size}x{image_size}")
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True if torch.cuda.is_available() else False,
        drop_last=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True if torch.cuda.is_available() else False,
        drop_last=False
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True if torch.cuda.is_available() else False,
        drop_last=False
    )
    
    # Statistiques
    logger.info(f"\n📊 Statistiques DataLoaders:")
    logger.info(f"  Train batches: {len(train_loader):,}")
    logger.info(f"  Val batches: {len(val_loader):,}")
    logger.info(f"  Test batches: {len(test_loader):,}")
    
    logger.info(f"\n✅ DATALOADERS CRÉÉS AVEC SUCCÈS !")
    logger.info("="*60)
    
    return train_loader, val_loader, test_loader


def test_dataloaders():
    """Test des DataLoaders."""
    logger.info("\n" + "="*60)
    logger.info("🧪 TEST DES DATALOADERS")
    logger.info("="*60)
    
    # Créer les DataLoaders
    train_loader, val_loader, test_loader = get_dataloaders(
        csv_path="data/raw/Data_Entry_2017.csv",
        image_root="data/raw",
        splits_dir="data/splits",
        batch_size=16,
        num_workers=0,  # 0 pour éviter les erreurs Windows
        image_size=224
    )
    
    # Tester un batch
    logger.info(f"\n🔍 Test d'un batch du train loader...")
    
    for images, labels, names in train_loader:
        logger.info(f"\n  Images shape: {images.shape}")
        logger.info(f"  Labels shape: {labels.shape}")
        logger.info(f"  Nombre d'images: {len(names)}")
        logger.info(f"  Premier nom: {names[0]}")
        logger.info(f"  Image min/max: {images.min():.3f} / {images.max():.3f}")
        logger.info(f"  Labels (première image): {labels[0]}")
        logger.info(f"  Pathologies présentes: {torch.where(labels[0] == 1.0)[0].tolist()}")
        break
    
    logger.info(f"\n✅ TEST RÉUSSI !")
    logger.info("="*60)


if __name__ == "__main__":
    test_dataloaders()