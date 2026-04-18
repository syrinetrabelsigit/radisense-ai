import pytest


class TestGetPatients:
    def test_get_patients_authenticated(self, client, radiologist_token):
        response = client.get("/api/patients/", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "patients" in data or "total" in data

    def test_get_patients_unauthenticated(self, client):
        response = client.get("/api/patients/")
        assert response.status_code == 403
    def test_get_patients_as_admin(self, client, admin_token):
        response = client.get("/api/patients/", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_patients_as_patient_forbidden(self, client, patient_token):
        response = client.get("/api/patients/", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 403


class TestCreatePatient:
    def test_create_patient_success(self, client, radiologist_token):
        response = client.post("/api/patients/", json={
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "email": "john.doe@test.com",
            "phone": "+21612345678"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["first_name"] == "John"

    def test_create_patient_missing_required_fields(self, client, radiologist_token):
        response = client.post("/api/patients/", json={
            "first_name": "John"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code == 422

    def test_create_patient_unauthenticated(self, client):
        response = client.post("/api/patients/", json={
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "gender": "male"
        })
        assert response.status_code == 403


class TestGetPatientById:
    def test_get_patient_success(self, client, radiologist_token, patient):
        response = client.get(f"/api/patients/{patient.id}", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200
        assert response.json()["first_name"] == "John"

    def test_get_patient_not_found(self, client, radiologist_token):
        response = client.get("/api/patients/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

    def test_get_patient_invalid_id(self, client, radiologist_token):
        response = client.get("/api/patients/abc", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 422


class TestUpdatePatient:
    def test_update_patient_success(self, client, radiologist_token, patient):
        response = client.put(f"/api/patients/{patient.id}", json={
            "first_name": "UpdatedJohn",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "gender": "male"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code == 200
        assert response.json()["first_name"] == "UpdatedJohn"

    def test_update_patient_not_found(self, client, radiologist_token):
        response = client.put("/api/patients/99999", json={
            "first_name": "Test"
        }, headers={"Authorization": f"Bearer {radiologist_token}"})
        assert response.status_code in [404, 422]

    def test_update_patient_unauthenticated(self, client):
        response = client.put("/api/patients/1", json={"first_name": "Test"})
        assert response.status_code == 403


class TestDeletePatient:
    def test_delete_patient_success(self, client, radiologist_token, patient):
        response = client.delete(f"/api/patients/{patient.id}", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 204]

    def test_delete_patient_not_found(self, client, radiologist_token):
        response = client.delete("/api/patients/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

    def test_delete_patient_unauthenticated(self, client):
        response = client.delete("/api/patients/1")
        assert response.status_code == 403


class TestPatientAnalyses:
    def test_get_patient_analyses(self, client, radiologist_token, patient):
        response = client.get(f"/api/patients/{patient.id}/analyses", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_my_records(self, client, radiologist_token):
        response = client.get("/api/patients/my-records", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 403, 404]

    def test_check_national_id(self, client, radiologist_token):
        response = client.get("/api/patients/check-national-id/TEST123", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 404]
class TestPatientEndpoints:
    def test_get_my_records_as_patient(self, client, patient_token):
        response = client.get("/api/patients/my-records", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [200, 404]

    def test_get_my_analyses_as_patient(self, client, patient_token):
        response = client.get("/api/patients/analyses", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [200, 404]

    def test_get_my_records_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/patients/my-records", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_admin_get_all_patients(self, client, admin_token):
        response = client.get("/api/patients/admin/all", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_admin_get_all_patients_forbidden(self, client, radiologist_token):
        response = client.get("/api/patients/admin/all", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_admin_stats(self, client, admin_token):
        response = client.get("/api/patients/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_second_opinion_as_patient(self, client, patient_token):
        response = client.post("/api/patients/second-opinion-request", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [200, 404]

    def test_second_opinion_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.post("/api/patients/second-opinion-request", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403
    def test_get_patients_with_search(self, client, radiologist_token):
        response = client.get("/api/patients/?search=john", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200
    def test_admin_get_patients_with_search(self, client, admin_token):
        response = client.get("/api/patients/admin/all?search=john", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200