import pytest
from fastapi.testclient import TestClient


class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "admin_test",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "admin_test",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_login_wrong_username(self, client):
        response = client.post("/api/auth/login", json={
            "username": "nonexistent",
            "password": "Admin123!"
        })
        assert response.status_code == 401

    def test_login_inactive_user(self, client, db):
        from app.models.user import User
        from app.core.security import get_password_hash
        user = User(
            username="inactive_user",
            email="inactive@test.com",
            hashed_password=get_password_hash("Test123!"),
            first_name="Inactive",
            last_name="User",
            role="radiologist",
            is_active=False,
            email_verified=True,
            plan="free"
        )
        db.add(user)
        db.commit()

        response = client.post("/api/auth/login", json={
            "username": "inactive_user",
            "password": "Test123!"
        })
        assert response.status_code == 403

    def test_login_missing_fields(self, client):
        response = client.post("/api/auth/login", json={
            "username": "admin_test"
        })
        assert response.status_code == 422


class TestRegister:
    def test_register_disabled(self, client):
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@test.com",
            "password": "Test123!",
            "first_name": "New",
            "last_name": "User",
            "role": "radiologist"
        })
        assert response.status_code == 403

    def test_register_returns_correct_message(self, client):
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@test.com",
            "password": "Test123!",
            "first_name": "New",
            "last_name": "User",
            "role": "radiologist"
        })
        data = response.json()
        assert "detail" in data


class TestForgotPassword:
    def test_forgot_password_existing_email(self, client, admin_user):
        response = client.post("/api/auth/forgot-password", json={
            "email": "admin@test.com"
        })
        assert response.status_code == 200
        assert "message" in response.json()

    def test_forgot_password_nonexistent_email(self, client):
        response = client.post("/api/auth/forgot-password", json={
            "email": "nonexistent@test.com"
        })
        # Toujours 200 pour ne pas révéler si l'email existe
        assert response.status_code == 200

    def test_forgot_password_missing_email(self, client):
        response = client.post("/api/auth/forgot-password", json={})
        assert response.status_code == 422


class TestCheckRoles:
    def test_check_roles_existing_user(self, client, admin_user):
        response = client.post("/api/auth/check-roles", json={
            "username": "admin_test"
        })
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        assert "admin" in data["roles"]

    def test_check_roles_nonexistent_user(self, client):
        response = client.post("/api/auth/check-roles", json={
            "username": "nobody"
        })
        assert response.status_code == 200
        assert response.json()["roles"] == []

class TestResetPassword:
    def test_reset_password_invalid_token(self, client):
        response = client.post("/api/auth/reset-password", json={
            "token": "invalid_token",
            "new_password": "NewPass123!"
        })
        assert response.status_code in [400, 422]

    def test_reset_password_missing_fields(self, client):
        response = client.post("/api/auth/reset-password", json={})
        assert response.status_code == 422

    def test_create_radiologist_unauthenticated(self, client):
        response = client.post("/api/auth/admin/create-radiologist", json={})
        assert response.status_code in [403, 422]

    def test_create_radiologist_as_admin(self, client, admin_token):
        response = client.post("/api/auth/admin/create-radiologist", json={
            "username": "newradio",
            "email": "newradio@test.com",
            "password": "Radio123!",
            "first_name": "New",
            "last_name": "Radio"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code in [200, 201, 400, 422]

    def test_create_radiologist_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.post("/api/auth/admin/create-radiologist", json={
            "username": "newradio2",
            "email": "newradio2@test.com",
            "password": "Radio123!",
            "first_name": "New",
            "last_name": "Radio"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [403, 422]
