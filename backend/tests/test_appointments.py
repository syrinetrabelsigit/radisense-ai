import pytest


class TestPatientAppointments:
    def test_get_my_appointments_as_patient(self, client, patient_token):
        response = client.get("/api/appointments/my-appointments", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [200, 404]

    def test_get_my_appointments_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/appointments/my-appointments", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_get_my_appointments_unauthenticated(self, client):
        response = client.get("/api/appointments/my-appointments")
        assert response.status_code == 403

    def test_get_radiologists_as_patient(self, client, patient_token):
        response = client.get("/api/appointments/radiologists", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 200

    def test_get_radiologists_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/appointments/radiologists", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_get_radiologists_unauthenticated(self, client):
        response = client.get("/api/appointments/radiologists")
        assert response.status_code == 403

    def test_create_appointment_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.post("/api/appointments/", json={}, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [403, 422]

    def test_create_appointment_unauthenticated(self, client):
        response = client.post("/api/appointments/", json={})
        assert response.status_code == 403

    def test_cancel_appointment_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.post("/api/appointments/99999/cancel", json={"reason": "test"}, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_cancel_appointment_unauthenticated(self, client):
        response = client.post("/api/appointments/1/cancel", json={"reason": "test"})
        assert response.status_code == 403

    def test_delete_appointment_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.delete("/api/appointments/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_delete_appointment_unauthenticated(self, client):
        response = client.delete("/api/appointments/1")
        assert response.status_code == 403
    def test_create_appointment_as_patient_missing_patient_profile(self, client, patient_token):
        response = client.post("/api/appointments/", json={
            "radiologist_id": 1,
            "appointment_date": "2025-12-01",
            "appointment_time": "10:00",
            "appointment_type": "consultation"
        }, headers={"Authorization": f"Bearer {patient_token}"})
        assert response.status_code in [200, 404, 409]

    def test_cancel_as_patient_missing_profile(self, client, patient_token):
        response = client.post("/api/appointments/99999/cancel", json={"reason": "test"}, headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [404, 400]

    def test_delete_as_patient_missing_profile(self, client, patient_token):
        response = client.delete("/api/appointments/99999", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code in [404, 400]
    def test_update_appointment_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.put("/api/appointments/99999", json={}, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [403, 422]

    def test_update_appointment_unauthenticated(self, client):
        response = client.put("/api/appointments/99999", json={})
        assert response.status_code == 403

    def test_radiologist_cancel_as_patient_forbidden(self, client, patient_token):
        response = client.put("/api/appointments/radiologist/99999/cancel", json={"reason": "test"}, headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 403

    def test_radiologist_cancel_not_found(self, client, radiologist_token):
        response = client.put("/api/appointments/radiologist/99999/cancel", json={"reason": "test"}, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

class TestRadiologistSchedule:
    def test_get_my_schedule_as_radiologist(self, client, radiologist_token):
        response = client.get("/api/appointments/radiologist/my-schedule", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_my_schedule_as_patient_forbidden(self, client, patient_token):
        response = client.get("/api/appointments/radiologist/my-schedule", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 403

    def test_get_my_schedule_unauthenticated(self, client):
        response = client.get("/api/appointments/radiologist/my-schedule")
        assert response.status_code == 403

    def test_confirm_appointment_not_found(self, client, radiologist_token):
        response = client.put("/api/appointments/radiologist/99999/confirm", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

    def test_confirm_appointment_as_patient_forbidden(self, client, patient_token):
        response = client.put("/api/appointments/radiologist/99999/confirm", headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 403

    def test_complete_appointment_not_found(self, client, radiologist_token):
        response = client.put("/api/appointments/radiologist/99999/complete", json={"notes": "done"}, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

    def test_complete_appointment_as_patient_forbidden(self, client, patient_token):
        response = client.put("/api/appointments/radiologist/99999/complete", json={"notes": "done"}, headers={
            "Authorization": f"Bearer {patient_token}"
        })
        assert response.status_code == 403


class TestAdminAppointments:
    def test_get_all_appointments_as_admin(self, client, admin_token):
        response = client.get("/api/appointments/admin/all", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_all_appointments_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/appointments/admin/all", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_get_all_appointments_unauthenticated(self, client):
        response = client.get("/api/appointments/admin/all")
        assert response.status_code == 403

    def test_get_admin_stats_as_admin(self, client, admin_token):
        response = client.get("/api/appointments/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200

    def test_get_admin_stats_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.get("/api/appointments/admin/stats", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403

    def test_get_admin_stats_unauthenticated(self, client):
        response = client.get("/api/appointments/admin/stats")
        assert response.status_code == 403

    def test_delete_appointment_not_found(self, client, admin_token):
        response = client.delete("/api/appointments/admin/99999", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404

    def test_delete_appointment_as_radiologist_forbidden(self, client, radiologist_token):
        response = client.delete("/api/appointments/admin/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 403