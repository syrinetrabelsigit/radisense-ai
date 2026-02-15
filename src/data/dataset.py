"""
PyTorch Dataset pour ChestX-ray14
RadiSense AI - Deep Learning Module
Author: Syrine Trabelsi
Date: Février 2026

Ce module définit la classe Dataset PyTorch pour charger les radiographies
avec leurs labels multi-classes.
"""

import os
import pandas as pd
import torch
from torch.utils.data import Dataset
from PIL import Image
import numpy as np
from typing import Tuple, List, Optional
import glob
import logging

from data.preprocessing import ChestXrayPreprocessor

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChestXrayDataset(Dataset):
    """
    Dataset PyTorch pour ChestX-ray14.
    
    Gère le chargement des images et leurs labels multi-classes (14 pathologies).
    
    Attributes:
        csv_path (str): Chemin vers Data_Entry_2017.csv
        image_folders (List[str]): Liste des dossiers d'images
        mode (str): 'train', 'val', ou 'test'
        preprocessor (ChestXrayPreprocessor): Instance du preprocessor
        data (pd.DataFrame): DataFrame avec les images et labels
        pathologies (List[str]): Liste des 14 pathologies
    """
    
    # Les 14 pathologies du dataset
    PATHOLOGIES = [
        'Atelectasis',
        'Cardiomegaly',
        'Effusion',
        'Infiltration',
        'Mass',
        'Nodule',
        'Pneumonia',
        'Pneumothorax',
        'Consolidation',
        'Edema',
        'Emphysema',
        'Fibrosis',
        'Pleural_Thickening',
        'Hernia'
    ]
    
    def __init__(
        self,
        csv_path: str,
        image_root: str,
        mode: str = 'train',
        image_size: int = 224,
        transform: Optional[any] = None
    ):
        """
        Initialise le dataset.
        
        Args:
            csv_path: Chemin vers Data_Entry_2017.csv
            image_root: Dossier racine contenant images_001 à images_012
            mode: 'train', 'val', ou 'test'
            image_size: Taille des images (défaut: 224)
            transform: Transformations custom (optionnel)
        """
        self.csv_path = csv_path
        self.image_root = image_root
        self.mode = mode
        self.image_size = image_size
        
        # Charger le CSV
        logger.info(f"📂 Chargement du CSV: {csv_path}")
        self.df = pd.read_csv(csv_path)
        logger.info(f"✅ CSV chargé: {len(self.df):,} entrées")
        
        # Trouver tous les dossiers d'images
        self.image_folders = sorted(glob.glob(os.path.join(image_root, "images_*")))
        logger.info(f"📁 Dossiers d'images trouvés: {len(self.image_folders)}")
        
        # Créer le mapping image_name -> path
        self.image_paths = self._create_image_path_mapping()
        
        # Filtrer le DataFrame pour ne garder que les images existantes
        self.df = self.df[self.df['Image Index'].isin(self.image_paths.keys())]
        logger.info(f"✅ Images valides: {len(self.df):,}")
        
        # Preprocessor
        self.preprocessor = ChestXrayPreprocessor(image_size=image_size)
        self.transform = transform
        
        # Statistiques
        self._compute_statistics()
    
    def _create_image_path_mapping(self) -> dict:
        """
        Crée un dictionnaire {nom_image: chemin_complet}.
        
        Returns:
            Dictionnaire mapping les noms d'images vers leurs chemins
        """
        logger.info("🔍 Création du mapping des images...")
        image_paths = {}
        
        for folder in self.image_folders:
            # Chercher dans le sous-dossier images/
            images = glob.glob(os.path.join(folder, "images", "*.png"))
            
            for img_path in images:
                img_name = os.path.basename(img_path)
                image_paths[img_name] = img_path
        
        logger.info(f"✅ Mapping créé: {len(image_paths):,} images")
        return image_paths
    
    def _compute_statistics(self):
        """Calcule et affiche les statistiques du dataset."""
        logger.info("\n" + "="*60)
        logger.info(f"📊 STATISTIQUES DATASET ({self.mode.upper()})")
        logger.info("="*60)
        
        # Compter les pathologies
        pathology_counts = {p: 0 for p in self.PATHOLOGIES}
        no_finding_count = 0
        
        for findings in self.df['Finding Labels']:
            if findings == 'No Finding':
                no_finding_count += 1
            else:
                for pathology in findings.split('|'):
                    if pathology in pathology_counts:
                        pathology_counts[pathology] += 1
        
        logger.info(f"\nTotal images: {len(self.df):,}")
        logger.info(f"No Finding: {no_finding_count:,} ({no_finding_count/len(self.df)*100:.2f}%)")
        logger.info(f"\nPathologies:")
        
        for pathology in self.PATHOLOGIES:
            count = pathology_counts[pathology]
            pct = count / len(self.df) * 100
            logger.info(f"  {pathology:25s} : {count:6,} ({pct:5.2f}%)")
        
        logger.info("="*60 + "\n")
    
    def _encode_labels(self, finding_labels: str) -> torch.Tensor:
        """
        Encode les labels en vecteur binaire multi-classe.
        
        Args:
            finding_labels: String avec pathologies séparées par '|'
            
        Returns:
            Tensor binaire de taille (14,) avec 1 si pathologie présente
        """
        # Créer un vecteur de zéros
        labels = torch.zeros(len(self.PATHOLOGIES), dtype=torch.float32)
        
        # Si pas de pathologie, retourner le vecteur de zéros
        if finding_labels == 'No Finding':
            return labels
        
        # Sinon, mettre 1 pour chaque pathologie présente
        for pathology in finding_labels.split('|'):
            if pathology in self.PATHOLOGIES:
                idx = self.PATHOLOGIES.index(pathology)
                labels[idx] = 1.0
        
        return labels
    
    def __len__(self) -> int:
        """Retourne le nombre d'images dans le dataset."""
        return len(self.df)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, str]:
        """
        Récupère une image et ses labels.
        
        Args:
            idx: Index de l'image
            
        Returns:
            Tuple (image_tensor, labels_tensor, image_name)
        """
        # Récupérer les infos de l'image
        row = self.df.iloc[idx]
        image_name = row['Image Index']
        finding_labels = row['Finding Labels']
        
        # Chemin de l'image
        image_path = self.image_paths.get(image_name)
        
        if image_path is None:
            raise FileNotFoundError(f"Image non trouvée: {image_name}")
        
        # Preprocessing
        if self.mode == 'train' and self.transform is None:
            image_tensor = self.preprocessor.preprocess_train(image_path)
        else:
            image_tensor = self.preprocessor.preprocess_val(image_path)
        
        # Si une transformation custom est fournie
        if self.transform is not None:
            img = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(img)
        
        # Encoder les labels
        labels_tensor = self._encode_labels(finding_labels)
        
        return image_tensor, labels_tensor, image_name
    
    def get_sample(self, idx: int) -> dict:
        """
        Récupère un échantillon avec toutes ses informations.
        
        Args:
            idx: Index de l'image
            
        Returns:
            Dictionnaire avec image, labels, metadata
        """
        row = self.df.iloc[idx]
        image_tensor, labels_tensor, image_name = self[idx]
        
        # Pathologies présentes
        pathologies_present = [
            self.PATHOLOGIES[i] 
            for i in range(len(self.PATHOLOGIES)) 
            if labels_tensor[i] == 1.0
        ]
        
        return {
            'image': image_tensor,
            'labels': labels_tensor,
            'image_name': image_name,
            'finding_labels_str': row['Finding Labels'],
            'pathologies_present': pathologies_present,
            'patient_id': row.get('Patient ID', 'Unknown'),
            'patient_age': row.get('Patient Age', 'Unknown'),
            'patient_gender': row.get('Patient Gender', 'Unknown'),
        }


def test_dataset():
    """Fonction de test du dataset."""
    print("="*60)
    print("🧪 TEST DU DATASET")
    print("="*60)
    
    # Chemins
    csv_path = "data/raw/Data_Entry_2017.csv"
    image_root = "data/raw"
    
    # Créer le dataset
    dataset = ChestXrayDataset(
        csv_path=csv_path,
        image_root=image_root,
        mode='train',
        image_size=224
    )
    
    print(f"\n✅ Dataset créé: {len(dataset):,} images\n")
    
    # Tester quelques échantillons
    print("📸 Test de 3 échantillons:\n")
    
    for i in [0, 100, 1000]:
        sample = dataset.get_sample(i)
        
        print(f"Échantillon {i}:")
        print(f"  Image: {sample['image_name']}")
        print(f"  Shape: {sample['image'].shape}")
        print(f"  Labels: {sample['finding_labels_str']}")
        print(f"  Pathologies: {sample['pathologies_present'] if sample['pathologies_present'] else 'No Finding'}")
        print(f"  Patient: {sample['patient_id']} | {sample['patient_age']} ans | {sample['patient_gender']}")
        print()
    
    print("✅ Test terminé !")
    print("="*60)


if __name__ == "__main__":
    test_dataset()