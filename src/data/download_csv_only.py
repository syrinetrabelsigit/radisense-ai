"""
Télécharge SEULEMENT le fichier CSV (labels)
"""
import subprocess
import os

os.makedirs("data/raw", exist_ok=True)

print("📥 Téléchargement du CSV des labels...")
subprocess.run([
    "kaggle", "datasets", "download",
    "-d", "nih-chest-xrays/data",
    "-f", "Data_Entry_2017.csv",
    "-p", "data/raw"
])

print("✅ CSV téléchargé ! (~100 MB)")