import pytest


class TestMessages:
    def test_get_inbox_authenticated(self, client, radiologist_token):
        response = client.get("/api/messages/inbox", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_inbox_unauthenticated(self, client):
        response = client.get("/api/messages/inbox")
        assert response.status_code == 403

    def test_get_sent_authenticated(self, client, radiologist_token):
        response = client.get("/api/messages/sent", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_sent_unauthenticated(self, client):
        response = client.get("/api/messages/sent")
        assert response.status_code == 403

    def test_get_unread_count_authenticated(self, client, radiologist_token):
        response = client.get("/api/messages/unread/count", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_unread_count_unauthenticated(self, client):
        response = client.get("/api/messages/unread/count")
        assert response.status_code == 403

    def test_send_message_success(self, client, admin_token, radiologist_user):
        response = client.post("/api/messages/send", json={
            "recipient_id": radiologist_user.id,
            "subject": "Test Subject",
            "message": "Test message content"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code in [200, 201]

    def test_send_message_missing_fields(self, client, admin_token):
        response = client.post("/api/messages/send", json={}, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 422

    def test_send_message_unauthenticated(self, client):
        response = client.post("/api/messages/send", json={
            "recipient_id": 1,
            "subject": "Test",
            "message": "Test"
        })
        assert response.status_code == 403

    def test_get_message_by_id(self, client, radiologist_token, message):
        response = client.get(f"/api/messages/{message.id}", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [200, 403]

    def test_delete_message_not_found(self, client, radiologist_token):
        response = client.delete("/api/messages/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [404, 403]

    def test_delete_message_unauthenticated(self, client):
        response = client.delete("/api/messages/1")
        assert response.status_code == 403