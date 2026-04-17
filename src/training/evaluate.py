"""
Evaluation Script pour RadiSense AI
Author: Syrine Trabelsi

Évalue tous les modèles entraînés sur le test set.
Génère un rapport de comparaison complet.
"""

import os
import sys
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from tqdm import tqdm
from sklearn.metrics import (
    roc_auc_score, 
    accuracy_score, 
    precision_score, 
    recall_score, 
    f1_score,
    classification_report,
    confusion_matrix
)
import matplotlib.pyplot as plt
import seaborn as sns
import json
import logging

# Ajouter le chemin parent pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.densenet import DenseNet121
from models.resnet import ResNet50
from models.efficientnet import EfficientNetB0
from models.mobilenet import MobileNetV2
from data.dataloader import get_dataloaders

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Classe pour évaluer les modèles entraînés."""
    
    PATHOLOGIES = [
        'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration',
        'Mass', 'Nodule', 'Pneumonia', 'Pneumothorax',
        'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
        'Pleural_Thickening', 'Hernia'
    ]
    
    def __init__(self, models_dir="models", results_dir="results"):
        self.models_dir = models_dir
        self.results_dir = results_dir
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        os.makedirs(results_dir, exist_ok=True)
        
        logger.info(f"🖥️  Device: {self.device}")
    
    def load_model(self, model_name):
        """Charge un modèle entraîné."""
        logger.info(f"\n📂 Chargement du modèle: {model_name}")
        
        # Mapper le nom au modèle
        models_dict = {
            'densenet': DenseNet121,
            'resnet': ResNet50,
            'efficientnet': EfficientNetB0,
            'mobilenet': MobileNetV2,
        }
        
        if model_name not in models_dict:
            raise ValueError(f"Modèle inconnu: {model_name}")
        
        # Créer le modèle
        model = models_dict[model_name](num_classes=14, pretrained=False)
        
        # Charger les poids
        weights_path = os.path.join(self.models_dir, f"{model_name}_best.pth")
        
        if not os.path.exists(weights_path):
            logger.warning(f"⚠️  Modèle non trouvé: {weights_path}")
            return None
        
        model.load_state_dict(torch.load(weights_path, map_location=self.device))
        model = model.to(self.device)
        model.eval()
        
        logger.info(f"✅ Modèle chargé: {weights_path}")
        return model
    
    def evaluate_model(self, model, test_loader):
        """Évalue un modèle sur le test set."""
        all_labels = []
        all_outputs = []
        all_preds = []
        
        logger.info("🔍 Évaluation en cours...")
        
        with torch.no_grad():
            for images, labels, _ in tqdm(test_loader, desc="Test"):
                images = images.to(self.device)
                labels = labels.to(self.device)
                
                outputs = model(images)
                probs = torch.sigmoid(outputs)
                preds = (probs > 0.5).float()
                
                all_labels.append(labels.cpu().numpy())
                all_outputs.append(probs.cpu().numpy())
                all_preds.append(preds.cpu().numpy())
        
        # Concatener tous les résultats
        all_labels = np.vstack(all_labels)
        all_outputs = np.vstack(all_outputs)
        all_preds = np.vstack(all_preds)
        
        # Calculer les métriques
        metrics = self.compute_metrics(all_labels, all_outputs, all_preds)
        
        return metrics, all_labels, all_outputs, all_preds
    
    def compute_metrics(self, labels, outputs, preds):
        """Calcule toutes les métriques."""
        metrics = {}
        
        # AUC-ROC (macro)
        try:
            auc_macro = roc_auc_score(labels, outputs, average='macro')
            metrics['auc_macro'] = auc_macro
        except:
            metrics['auc_macro'] = 0.0
        
        # AUC-ROC par pathologie
        auc_per_class = []
        for i in range(labels.shape[1]):
            try:
                auc = roc_auc_score(labels[:, i], outputs[:, i])
                auc_per_class.append(auc)
            except:
                auc_per_class.append(0.0)
        
        metrics['auc_per_class'] = dict(zip(self.PATHOLOGIES, auc_per_class))
        
        # Accuracy, Precision, Recall, F1
        metrics['accuracy'] = accuracy_score(labels, preds)
        metrics['precision_macro'] = precision_score(labels, preds, average='macro', zero_division=0)
        metrics['recall_macro'] = recall_score(labels, preds, average='macro', zero_division=0)
        metrics['f1_macro'] = f1_score(labels, preds, average='macro', zero_division=0)
        
        # Par pathologie
        precision_per_class = precision_score(labels, preds, average=None, zero_division=0)
        recall_per_class = recall_score(labels, preds, average=None, zero_division=0)
        f1_per_class = f1_score(labels, preds, average=None, zero_division=0)
        
        metrics['precision_per_class'] = dict(zip(self.PATHOLOGIES, precision_per_class))
        metrics['recall_per_class'] = dict(zip(self.PATHOLOGIES, recall_per_class))
        metrics['f1_per_class'] = dict(zip(self.PATHOLOGIES, f1_per_class))
        
        return metrics
    
    def evaluate_all_models(self, test_loader):
        """Évalue tous les modèles disponibles."""
        logger.info("="*60)
        logger.info("🚀 ÉVALUATION DE TOUS LES MODÈLES")
        logger.info("="*60)
        
        models_to_eval = ['densenet', 'resnet', 'efficientnet', 'mobilenet']
        all_results = {}
        
        for model_name in models_to_eval:
            logger.info(f"\n{'='*60}")
            logger.info(f"📊 Modèle: {model_name.upper()}")
            logger.info(f"{'='*60}")
            
            model = self.load_model(model_name)
            
            if model is None:
                logger.warning(f"⏭️  Modèle {model_name} ignoré")
                continue
            
            metrics, labels, outputs, preds = self.evaluate_model(model, test_loader)
            
            all_results[model_name] = {
                'metrics': metrics,
                'labels': labels,
                'outputs': outputs,
                'preds': preds
            }
            
            # Afficher les résultats
            logger.info(f"\n📊 RÉSULTATS {model_name.upper()}:")
            logger.info(f"  AUC-ROC (macro): {metrics['auc_macro']:.4f}")
            logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
            logger.info(f"  Precision (macro): {metrics['precision_macro']:.4f}")
            logger.info(f"  Recall (macro): {metrics['recall_macro']:.4f}")
            logger.info(f"  F1-Score (macro): {metrics['f1_macro']:.4f}")
        
        return all_results
    
    def generate_comparison_report(self, all_results):
        """Génère un rapport de comparaison."""
        logger.info("\n" + "="*60)
        logger.info("📊 RAPPORT DE COMPARAISON")
        logger.info("="*60)
        
        # DataFrame de comparaison
        comparison_data = []
        for model_name, results in all_results.items():
            metrics = results['metrics']
            comparison_data.append({
                'Model': model_name.upper(),
                'AUC-ROC': f"{metrics['auc_macro']:.4f}",
                'Accuracy': f"{metrics['accuracy']:.4f}",
                'Precision': f"{metrics['precision_macro']:.4f}",
                'Recall': f"{metrics['recall_macro']:.4f}",
                'F1-Score': f"{metrics['f1_macro']:.4f}"
            })
        
        df = pd.DataFrame(comparison_data)
        
        # Trier par AUC-ROC
        df['AUC_numeric'] = df['AUC-ROC'].astype(float)
        df = df.sort_values('AUC_numeric', ascending=False).drop('AUC_numeric', axis=1)
        
        logger.info("\n" + df.to_string(index=False))
        
        # Sauvegarder CSV
        csv_path = os.path.join(self.results_dir, "model_comparison.csv")
        df.to_csv(csv_path, index=False)
        logger.info(f"\n💾 Rapport sauvegardé: {csv_path}")
        
        # Sauvegarder JSON détaillé
        json_path = os.path.join(self.results_dir, "evaluation_results.json")
        json_data = {}
        for model_name, results in all_results.items():
            json_data[model_name] = results['metrics']
        
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        logger.info(f"💾 Résultats détaillés: {json_path}")
        
        return df
    
    def plot_comparison(self, all_results):
        """Génère des graphiques de comparaison."""
        logger.info("\n📊 Génération des graphiques...")
        
        models = list(all_results.keys())
        auc_scores = [all_results[m]['metrics']['auc_macro'] for m in models]
        
        # Graphique AUC-ROC
        plt.figure(figsize=(10, 6))
        bars = plt.bar(models, auc_scores, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'][:len(models)])
        plt.ylabel('AUC-ROC Score', fontsize=12)
        plt.title('Comparaison des Modèles - AUC-ROC', fontsize=14, fontweight='bold')
        plt.ylim(0.7, 0.9)
        
        # Ajouter les valeurs sur les barres
        for bar, score in zip(bars, auc_scores):
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{score:.4f}',
                    ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plot_path = os.path.join(self.results_dir, "model_comparison_auc.png")
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"💾 Graphique sauvegardé: {plot_path}")


def main():
    """Fonction principale."""
    
    # DataLoader
    logger.info("📂 Chargement du test set...")
    _, _, test_loader = get_dataloaders(
        csv_path="data/cleaned/Data_Entry_2017_clean.csv",
        image_root="data/raw",
        splits_dir="data/splits",
        batch_size=32,
        num_workers=0,
        image_size=224
    )
    
    # Évaluateur
    evaluator = ModelEvaluator()
    
    # Évaluer tous les modèles
    all_results = evaluator.evaluate_all_models(test_loader)
    
    if not all_results:
        logger.error("❌ Aucun modèle évalué !")
        return
    
    # Générer le rapport
    evaluator.generate_comparison_report(all_results)
    
    # Graphiques
    evaluator.plot_comparison(all_results)
    
    logger.info("\n" + "="*60)
    logger.info("✅ ÉVALUATION TERMINÉE !")
    logger.info("="*60)
    logger.info(f"📂 Résultats dans: {evaluator.results_dir}/")


if __name__ == "__main__":
    main()