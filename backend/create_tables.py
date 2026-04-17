from app.core.database import engine, Base
from app.models import user, patient, analysis, report

# Import tous les modèles pour que SQLAlchemy les connaisse
print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("✅ Tables created successfully!")
print("\nTables created:")
print("- users")
print("- patients")
print("- analyses")
print("- reports")