import pytest
import io
from PIL import Image
import numpy as np


def create_test_image():
    """Créer une image de test en mémoire"""
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


class TestPredictEndpoint:
    def test_predict_unauthenticated(self, client):
        img = create_test_image()
        response = client.post("/api/predict/", files={
            "file": ("test.png", img, "image/png")
        })
        assert response.status_code == 403

    def test_predict_no_file(self, client, radiologist_token):
        response = client.post("/api/predict/", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 422

    def test_predict_invalid_file_type(self, client, radiologist_token):
        fake_file = io.BytesIO(b"this is not an image")
        response = client.post("/api/predict/", files={
            "file": ("test.txt", fake_file, "text/plain")
        }, headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code in [400, 422]


class TestPredictHistory:
    def test_get_predictions_authenticated(self, client, radiologist_token):
        response = client.get("/api/predict/", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_get_predictions_unauthenticated(self, client):
        response = client.get("/api/predict/")
        assert response.status_code == 403

    def test_get_predictions_returns_list(self, client, radiologist_token):
        response = client.get("/api/predict/", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "analyses" in data or "total" in data


class TestPredictById:
    def test_get_prediction_not_found(self, client, radiologist_token):
        response = client.get("/api/predict/99999", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 404

    def test_get_prediction_unauthenticated(self, client):
        response = client.get("/api/predict/1")
        assert response.status_code == 403
