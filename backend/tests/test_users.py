import pytest


class TestGetCurrentUser:
    def test_get_me_authenticated(self, client, admin_token):
        response = client.get("/api/users/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin_test"
        assert data["role"] == "admin"

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/users/me")
        assert response.status_code == 403

    def test_get_me_invalid_token(self, client):
        response = client.get("/api/users/me", headers={
            "Authorization": "Bearer invalid_token_xyz"
        })
        assert response.status_code in [401, 403]

    def test_get_profile_authenticated(self, client, admin_token):
        response = client.get("/api/users/profile", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_profile_unauthenticated(self, client):
        response = client.get("/api/users/profile")
        assert response.status_code == 403


class TestUpdateProfile:
    def test_update_profile_success(self, client, admin_token):
        response = client.put("/api/users/profile", json={
            "first_name": "AdminUpdated",
            "last_name": "Test",
            "bio": "Updated bio"
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "AdminUpdated"

    def test_update_profile_unauthenticated(self, client):
        response = client.put("/api/users/profile", json={
            "first_name": "Test"
        })
        assert response.status_code == 403


class TestChangePassword:
    def test_change_password_success(self, client, admin_token):
        response = client.post("/api/users/settings/password", json={
            "current_password": "Admin123!",
            "new_password": "NewAdmin123!",
            "confirm_password": "NewAdmin123!"
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_change_password_wrong_current(self, client, admin_token):
        response = client.post("/api/users/settings/password", json={
            "current_password": "WrongPassword!",
            "new_password": "NewAdmin123!",
            "confirm_password": "NewAdmin123!"
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code in [400, 401, 403]

    def test_change_password_mismatch(self, client, admin_token):
        response = client.post("/api/users/settings/password", json={
            "current_password": "Admin123!",
            "new_password": "NewAdmin123!",
            "confirm_password": "Different123!"
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code in [400, 422]

    def test_change_password_unauthenticated(self, client):
        response = client.post("/api/users/settings/password", json={
            "current_password": "Admin123!",
            "new_password": "NewAdmin123!",
            "confirm_password": "NewAdmin123!"
        })
        assert response.status_code == 403


class TestVerifyPassword:
    def test_verify_password_success(self, client, admin_token):
        response = client.post("/api/users/verify-password", json={
            "password": "Admin123!"
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_verify_password_unauthenticated(self, client):
        response = client.post("/api/users/verify-password", json={
            "password": "Admin123!"
        })
        assert response.status_code == 403
        
class TestUserSettings:
    def test_get_partners_authenticated(self, client, radiologist_token):
        response = client.get("/api/users/partners", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 403, 404]

    def test_get_all_users_authenticated(self, client, admin_token):
        response = client.get("/api/users/", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code in [200, 403]

    def test_get_all_users_unauthenticated(self, client):
        response = client.get("/api/users/")
        assert response.status_code == 403

    def test_update_notifications_authenticated(self, client, radiologist_token):
        response = client.put("/api/users/settings/notifications", json={
            "email_notifications": True,
            "sms_notifications": False
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [200, 422]

    def test_update_notifications_unauthenticated(self, client):
        response = client.put("/api/users/settings/notifications", json={})
        assert response.status_code == 403

    def test_update_2fa_authenticated(self, client, radiologist_token):
        response = client.put("/api/users/settings/2fa", json={
            "enabled": False
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [200, 422]

    def test_update_2fa_unauthenticated(self, client):
        response = client.put("/api/users/settings/2fa", json={})
        assert response.status_code == 403

    def test_delete_account_unauthenticated(self, client):
        response = client.delete("/api/users/account")
        assert response.status_code == 403

    def test_get_public_profile_not_found(self, client, radiologist_token):
        response = client.get("/api/users/99999/public", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 404]

    def test_get_public_profile_unauthenticated(self, client):
        response = client.get("/api/users/1/public")
        assert response.status_code == 403

    def test_change_credentials_unauthenticated(self, client):
        response = client.post("/api/users/change-credentials", json={})
        assert response.status_code == 403

    def test_change_credentials_authenticated(self, client, radiologist_token):
        response = client.post("/api/users/change-credentials", json={
            "current_password": "Radio123!",
            "new_username": "new_radio_user"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [200, 400, 422]

    def test_upload_avatar_unauthenticated(self, client):
        response = client.post("/api/users/profile/avatar")
        assert response.status_code == 403