import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.main import app

# Base de données SQLite en mémoire pour les tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    # Créer les tables non gérées par SQLAlchemy
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                used INTEGER DEFAULT 0
            )
        """))
        conn.commit()
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db):
    user = User(
        username="admin_test",
        email="admin@test.com",
        hashed_password=get_password_hash("Admin123!"),
        first_name="Admin",
        last_name="Test",
        role="admin",
        is_active=True,
        email_verified=True,
        plan="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def radiologist_user(db):
    user = User(
        username="radio_test",
        email="radio@test.com",
        hashed_password=get_password_hash("Radio123!"),
        first_name="Radio",
        last_name="Test",
        role="radiologist",
        is_active=True,
        email_verified=True,
        plan="pro"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_token(client, admin_user):
    response = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "Admin123!"
    })
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def radiologist_token(client, radiologist_user):
    response = client.post("/api/auth/login", json={
        "username": "radio_test",
        "password": "Radio123!"
    })
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def patient(db, radiologist_user):
    from app.models.patient import Patient
    import uuid
    p = Patient(
        patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
        first_name="John",
        last_name="Doe",
        date_of_birth="1990-01-01",
        gender="male",
        phone="+21612345678",
        email="john.doe@test.com",
        created_by=radiologist_user.id,
        is_active=True
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture(scope="function")
def message(db, admin_user, radiologist_user):
    from app.models.message import Message, SenderTypeEnum
    m = Message(
        sender_id=admin_user.id,
        sender_type=SenderTypeEnum.admin,
        recipient_id=radiologist_user.id,
        recipient_type=SenderTypeEnum.radiologist,
        subject="Test Subject",
        message="Test message content",
        is_read=False
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@pytest.fixture(scope="function")
def patient_user(db):
    from app.core.security import get_password_hash
    user = User(
        username="patient_test",
        email="patient@test.com",
        hashed_password=get_password_hash("Patient123!"),
        first_name="Patient",
        last_name="Test",
        role="patient",
        is_active=True,
        email_verified=True,
        plan="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def patient_token(client, patient_user):
    response = client.post("/api/auth/login", json={
        "username": "patient_test",
        "password": "Patient123!"
    })
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def patient(db, radiologist_user):
    from app.models.patient import Patient
    from datetime import date
    import uuid
    p = Patient(
        patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1990, 1, 1),
        gender="male",
        phone="+21612345678",
        email="john.doe@test.com",
        created_by=radiologist_user.id,
        is_active=True
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p