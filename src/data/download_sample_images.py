"""
Télécharge juste 20 images pour la visualisation EDA
"""
import os

os.makedirs("data/raw/images", exist_ok=True)

print("📥 Téléchargement de 20 images échantillons...")
print()
print("⚠️ Kaggle API ne permet pas de télécharger fichier par fichier facilement")
print()
print("💡 Solution manuelle :")
print("1. Va sur : https://www.kaggle.com/datasets/nih-chest-xrays/sample")
print("2. Télécharge 'sample.zip' (plus petit)")
print("3. Décompresse dans data/raw/images/")
print()
print("OU utilise ces liens directs (quelques images) :")
print("https://www.kaggle.com/datasets/nih-chest-xrays/data/data?select=images")