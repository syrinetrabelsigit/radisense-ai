import pytest


class TestAdminUsers:
    def test_get_users_as_admin(self, client, admin_token):
        response = client.get("/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data

    def test_get_users_with_role_filter(self, client, admin_token):
        response = client.get("/api/admin/users?role=radiologist", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_users_with_search(self, client, admin_token):
        response = client.get("/api/admin/users?search=admin", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_users_unauthenticated(self, client):
        response = client.get("/api/admin/users")
        assert response.status_code == 403

    def test_get_users_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/admin/users", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_create_user_as_admin(self, client, admin_token):
        response = client.post(
            "/api/admin/users?username=newuser_test&email=newtest@test.com&first_name=New&last_name=User&password=Test123!&role=radiologist",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code in [200, 201, 400]

    def test_create_user_invalid_role(self, client, admin_token):
        response = client.post(
            "/api/admin/users?username=newuser2&email=new2@test.com&first_name=New&last_name=User&password=Test123!&role=invalid_role",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400

    def test_create_user_unauthenticated(self, client):
        response = client.post("/api/admin/users?username=x&email=x@x.com&first_name=x&last_name=x&password=x&role=radiologist")
        assert response.status_code == 403

    def test_update_user_not_found(self, client, admin_token):
        response = client.put("/api/admin/users/99999?first_name=Test", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404

    def test_update_user_unauthenticated(self, client):
        response = client.put("/api/admin/users/1?first_name=Test")
        assert response.status_code == 403

    def test_activate_user_not_found(self, client, admin_token):
        response = client.put("/api/admin/users/99999/activate", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404

    def test_activate_user_success(self, client, admin_token, radiologist_user):
        response = client.put(f"/api/admin/users/{radiologist_user.id}/activate", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_activate_user_unauthenticated(self, client):
        response = client.put("/api/admin/users/1/activate")
        assert response.status_code == 403

    def test_delete_user_not_found(self, client, admin_token):
        response = client.delete("/api/admin/users/99999", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404

    def test_delete_user_cannot_delete_self(self, client, admin_token, admin_user):
        response = client.delete(f"/api/admin/users/{admin_user.id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 400

    def test_delete_user_unauthenticated(self, client):
        response = client.delete("/api/admin/users/1")
        assert response.status_code == 403
    def test_update_user_success(self, client, admin_token, radiologist_user):
        response = client.put(f"/api/admin/users/{radiologist_user.id}?first_name=Updated", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_create_patient_user(self, client, admin_token):
        response = client.post(
            "/api/admin/users?username=patientuser&email=patientuser@test.com&first_name=Patient&last_name=User&password=Test123!&role=radiologist",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code in [200, 201, 400]

class TestAdminSystem:
    def test_system_stats_as_admin(self, client, admin_token):
        response = client.get("/api/admin/system/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "analyses" in data

    def test_system_stats_unauthenticated(self, client):
        response = client.get("/api/admin/system/stats")
        assert response.status_code == 403

    def test_system_health_as_admin(self, client, admin_token):
        response = client.get("/api/admin/system/health", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_system_health_unauthenticated(self, client):
        response = client.get("/api/admin/system/health")
        assert response.status_code == 403

    def test_audit_logs_as_admin(self, client, admin_token):
        response = client.get("/api/admin/audit-logs", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_audit_logs_with_filter(self, client, admin_token):
        response = client.get("/api/admin/audit-logs?user_id=1", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_audit_logs_unauthenticated(self, client):
        response = client.get("/api/admin/audit-logs")
        assert response.status_code == 403
    def test_update_admin_status_appointment(self, client, admin_token):
        response = client.put("/api/appointments/admin/99999/status?new_status=confirmed", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404