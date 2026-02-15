"""
MLflow Configuration pour RadiSense AI
Author: Syrine Trabelsi

Configuration et utilitaires pour le tracking MLflow.
"""

import mlflow
import mlflow.pytorch
import torch
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MLflowTracker:
    """
    Classe pour gérer le tracking MLflow des expériences.
    """
    
    def __init__(
        self,
        experiment_name: str = "RadiSense-AI-ChestXray14",
        tracking_uri: str = None
    ):
        """
        Initialise le tracker MLflow.
        
        Args:
            experiment_name: Nom de l'expérience MLflow
            tracking_uri: URI du serveur MLflow (None = local)
        """
        self.experiment_name = experiment_name
        
        # Configuration du tracking URI
        if tracking_uri is None:
            # Local: mlruns dans le dossier du projet
            mlruns_path = Path("mlruns").absolute()
            mlruns_path.mkdir(exist_ok=True)
            tracking_uri = f"file:///{mlruns_path}"
        
        mlflow.set_tracking_uri(tracking_uri)
        
        # Créer ou récupérer l'expérience
        try:
            experiment = mlflow.get_experiment_by_name(experiment_name)
            if experiment is None:
                experiment_id = mlflow.create_experiment(experiment_name)
                logger.info(f"✅ Expérience créée: {experiment_name} (ID: {experiment_id})")
            else:
                experiment_id = experiment.experiment_id
                logger.info(f"✅ Expérience existante: {experiment_name} (ID: {experiment_id})")
            
            mlflow.set_experiment(experiment_name)
            self.experiment_id = experiment_id
            
        except Exception as e:
            logger.error(f"❌ Erreur création expérience: {e}")
            raise
        
        logger.info(f"📍 Tracking URI: {tracking_uri}")
        logger.info(f"📊 Expérience active: {experiment_name}")
    
    def start_run(self, run_name: str, tags: dict = None):
        """
        Démarre un nouveau run MLflow.
        
        Args:
            run_name: Nom du run
            tags: Dictionnaire de tags optionnels
        """
        mlflow.start_run(run_name=run_name, tags=tags)
        logger.info(f"▶️  Run démarré: {run_name}")
        if tags:
            logger.info(f"   Tags: {tags}")
    
    def log_params(self, params: dict):
        """
        Log les hyperparamètres.
        
        Args:
            params: Dictionnaire des paramètres
        """
        for key, value in params.items():
            mlflow.log_param(key, value)
        logger.info(f"📝 Params loggés: {len(params)} paramètres")
    
    def log_metrics(self, metrics: dict, step: int = None):
        """
        Log les métriques.
        
        Args:
            metrics: Dictionnaire des métriques
            step: Numéro de step/epoch optionnel
        """
        for key, value in metrics.items():
            mlflow.log_metric(key, value, step=step)
    
    def log_model(self, model, artifact_path: str = "model"):
        """
        Log le modèle PyTorch.
        
        Args:
            model: Modèle PyTorch
            artifact_path: Chemin de l'artifact
        """
        mlflow.pytorch.log_model(model, artifact_path)
        logger.info(f"💾 Modèle loggé: {artifact_path}")
    
    def log_artifact(self, local_path: str, artifact_path: str = None):
        """
        Log un artifact (fichier).
        
        Args:
            local_path: Chemin local du fichier
            artifact_path: Chemin de destination dans MLflow
        """
        mlflow.log_artifact(local_path, artifact_path)
    
    def end_run(self):
        """Termine le run MLflow."""
        mlflow.end_run()
        logger.info("⏹️  Run terminé")
    
    @staticmethod
    def get_run_info():
        """Retourne les infos du run actif."""
        active_run = mlflow.active_run()
        if active_run:
            return {
                'run_id': active_run.info.run_id,
                'experiment_id': active_run.info.experiment_id,
                'status': active_run.info.status,
                'start_time': active_run.info.start_time,
            }
        return None


def test_mlflow():
    """Test de la configuration MLflow."""
    logger.info("="*60)
    logger.info("🧪 TEST MLFLOW SETUP")
    logger.info("="*60)
    
    # Créer le tracker
    tracker = MLflowTracker(experiment_name="RadiSense-AI-Test")
    
    # Démarrer un run de test
    tracker.start_run(
        run_name="test_run",
        tags={"type": "test", "model": "test"}
    )
    
    # Logger des params
    params = {
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 10,
        "model": "DenseNet121"
    }
    tracker.log_params(params)
    logger.info(f"✅ Params loggés: {params}")
    
    # Logger des métriques
    for epoch in range(3):
        metrics = {
            "train_loss": 0.5 - epoch * 0.1,
            "val_loss": 0.6 - epoch * 0.08,
            "accuracy": 0.7 + epoch * 0.05,
            "auc_roc": 0.75 + epoch * 0.03
        }
        tracker.log_metrics(metrics, step=epoch)
        logger.info(f"  Epoch {epoch}: {metrics}")
    
    # Infos du run
    run_info = tracker.get_run_info()
    logger.info(f"\n📊 Run Info:")
    logger.info(f"  Run ID: {run_info['run_id']}")
    logger.info(f"  Experiment ID: {run_info['experiment_id']}")
    
    # Terminer le run
    tracker.end_run()
    
    logger.info(f"\n✅ TEST MLFLOW RÉUSSI !")
    logger.info(f"📍 Vérifier dans: mlruns/")
    logger.info(f"🌐 Lancer UI: mlflow ui")
    logger.info("="*60)


if __name__ == "__main__":
    test_mlflow()