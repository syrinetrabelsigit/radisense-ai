"""
Training Script pour RadiSense AI
Author: Syrine Trabelsi

Script pour entraîner les 5 modèles sur ChestX-ray14.
"""

import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import argparse
from tqdm import tqdm
import numpy as np
from sklearn.metrics import roc_auc_score
import logging

# Ajouter le chemin parent pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.densenet import DenseNet121
from models.resnet import ResNet50
from models.efficientnet import EfficientNetB0
from models.vgg import VGG16
from models.mobilenet import MobileNetV2
from data.dataloader import get_dataloaders
from training.mlflow_setup import MLflowTracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Trainer:
    """Classe pour gérer l'entraînement."""
    
    def __init__(
        self,
        model,
        train_loader,
        val_loader,
        device,
        learning_rate=0.001,
        num_epochs=10,
        model_name="model"
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.num_epochs = num_epochs
        self.model_name = model_name
        
        # Loss et optimizer
        self.criterion = nn.BCEWithLogitsLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        
        # Meilleure validation
        self.best_val_auc = 0.0
        self.best_epoch = 0
        
        logger.info(f"✅ Trainer initialisé")
        logger.info(f"  Device: {device}")
        logger.info(f"  Learning rate: {learning_rate}")
        logger.info(f"  Epochs: {num_epochs}")
    
    def train_epoch(self):
        """Entraîne une epoch."""
        self.model.train()
        running_loss = 0.0
        
        pbar = tqdm(self.train_loader, desc="Training")
        for images, labels, _ in pbar:
            images = images.to(self.device)
            labels = labels.to(self.device)
            
            # Forward
            self.optimizer.zero_grad()
            outputs = self.model(images)
            loss = self.criterion(outputs, labels)
            
            # Backward
            loss.backward()
            self.optimizer.step()
            
            running_loss += loss.item()
            pbar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        epoch_loss = running_loss / len(self.train_loader)
        return epoch_loss
    
    def validate(self):
        """Valide le modèle."""
        self.model.eval()
        running_loss = 0.0
        all_labels = []
        all_outputs = []
        
        with torch.no_grad():
            for images, labels, _ in tqdm(self.val_loader, desc="Validation"):
                images = images.to(self.device)
                labels = labels.to(self.device)
                
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                running_loss += loss.item()
                
                # Pour AUC-ROC
                all_labels.append(labels.cpu().numpy())
                all_outputs.append(torch.sigmoid(outputs).cpu().numpy())
        
        val_loss = running_loss / len(self.val_loader)
        
        # Calculer AUC-ROC
        all_labels = np.vstack(all_labels)
        all_outputs = np.vstack(all_outputs)
        
        try:
            auc_roc = roc_auc_score(all_labels, all_outputs, average='macro')
        except:
            auc_roc = 0.0
        
        return val_loss, auc_roc
    
    def train(self, mlflow_tracker=None):
        """Boucle d'entraînement complète."""
        logger.info("="*60)
        logger.info(f"🚀 DÉBUT ENTRAÎNEMENT - {self.model_name}")
        logger.info("="*60)
        
        for epoch in range(self.num_epochs):
            logger.info(f"\n📊 Epoch {epoch+1}/{self.num_epochs}")
            
            # Train
            train_loss = self.train_epoch()
            logger.info(f"  Train Loss: {train_loss:.4f}")
            
            # Validate
            val_loss, val_auc = self.validate()
            logger.info(f"  Val Loss: {val_loss:.4f}")
            logger.info(f"  Val AUC-ROC: {val_auc:.4f}")
            
            # MLflow logging
            if mlflow_tracker:
                metrics = {
                    'train_loss': train_loss,
                    'val_loss': val_loss,
                    'val_auc_roc': val_auc,
                }
                mlflow_tracker.log_metrics(metrics, step=epoch)
            
            # Sauvegarder le meilleur modèle
            if val_auc > self.best_val_auc:
                self.best_val_auc = val_auc
                self.best_epoch = epoch
                self.save_model(f"models/{self.model_name}_best.pth")
                logger.info(f"  ✅ Meilleur modèle sauvegardé (AUC: {val_auc:.4f})")
        
        logger.info(f"\n🏆 Meilleur résultat:")
        logger.info(f"  Epoch: {self.best_epoch+1}")
        logger.info(f"  AUC-ROC: {self.best_val_auc:.4f}")
        logger.info("="*60)
        
        return self.best_val_auc
    
    def save_model(self, path):
        """Sauvegarde le modèle."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save(self.model.state_dict(), path)


def get_model(model_name, num_classes=14):
    """Retourne le modèle selon le nom."""
    models_dict = {
        'densenet': DenseNet121,
        'resnet': ResNet50,
        'efficientnet': EfficientNetB0,
        'vgg': VGG16,
        'mobilenet': MobileNetV2,
    }
    
    if model_name.lower() not in models_dict:
        raise ValueError(f"Modèle inconnu: {model_name}")
    
    return models_dict[model_name.lower()](num_classes=num_classes, pretrained=True)


def main():
    parser = argparse.ArgumentParser(description='Train ChestX-ray14 models')
    parser.add_argument('--model', type=str, required=True,
                       choices=['densenet', 'resnet', 'efficientnet', 'vgg', 'mobilenet'],
                       help='Model to train')
    parser.add_argument('--epochs', type=int, default=3,
                       help='Number of epochs')
    parser.add_argument('--batch_size', type=int, default=16,
                       help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001,
                       help='Learning rate')
    parser.add_argument('--num_workers', type=int, default=0,
                       help='Number of data loading workers')
    
    args = parser.parse_args()
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"🖥️  Device: {device}")
    
    # DataLoaders
    logger.info(f"\n📂 Chargement des données...")
    train_loader, val_loader, test_loader = get_dataloaders(
        csv_path="data/raw/Data_Entry_2017.csv",
        image_root="data/raw",
        splits_dir="data/splits",
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        image_size=224
    )
    
    # Modèle
    logger.info(f"\n🤖 Création du modèle: {args.model.upper()}")
    model = get_model(args.model, num_classes=14)
    logger.info(f"  Paramètres: {model.num_parameters:,}")
    
    # MLflow
    mlflow_tracker = MLflowTracker(experiment_name="RadiSense-AI-ChestXray14")
    
    run_name = f"{args.model.upper()}_lr{args.lr}_bs{args.batch_size}_ep{args.epochs}"
    tags = {
        'model': args.model,
        'batch_size': args.batch_size,
        'learning_rate': args.lr,
        'epochs': args.epochs,
    }
    
    mlflow_tracker.start_run(run_name=run_name, tags=tags)
    
    # Log params
    params = {
        'model': args.model,
        'learning_rate': args.lr,
        'batch_size': args.batch_size,
        'num_epochs': args.epochs,
        'num_parameters': model.num_parameters,
        'optimizer': 'Adam',
        'loss': 'BCEWithLogitsLoss',
    }
    mlflow_tracker.log_params(params)
    
    # Trainer
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        device=device,
        learning_rate=args.lr,
        num_epochs=args.epochs,
        model_name=args.model
    )
    
    # Train
    best_auc = trainer.train(mlflow_tracker)
    
    # Log final metric
    mlflow_tracker.log_metrics({'best_val_auc_roc': best_auc})
    
    # Sauvegarder le modèle dans MLflow
    mlflow_tracker.log_model(model, artifact_path="model")
    
    # Fin
    mlflow_tracker.end_run()
    
    logger.info(f"\n✅ ENTRAÎNEMENT TERMINÉ !")
    logger.info(f"🏆 Meilleur AUC-ROC: {best_auc:.4f}")


if __name__ == "__main__":
    main()