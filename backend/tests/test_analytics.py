import pytest


class TestAnalyticsDashboard:
    def test_dashboard_authenticated(self, client, radiologist_token):
        response = client.get("/api/analytics/dashboard", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_dashboard_unauthenticated(self, client):
        response = client.get("/api/analytics/dashboard")
        assert response.status_code == 403

    def test_performance_authenticated(self, client, radiologist_token):
        response = client.get("/api/analytics/performance", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_performance_with_dates(self, client, radiologist_token):
        response = client.get("/api/analytics/performance?start_date=2024-01-01&end_date=2024-12-31", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_performance_unauthenticated(self, client):
        response = client.get("/api/analytics/performance")
        assert response.status_code == 403

    def test_pathology_distribution_authenticated(self, client, radiologist_token):
        response = client.get("/api/analytics/pathology-distribution", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_pathology_distribution_with_period(self, client, radiologist_token):
        for period in ["day", "week", "month", "7days", "30days", "3months", "year"]:
            response = client.get(f"/api/analytics/pathology-distribution?period={period}", headers={
                "Authorization": f"Bearer {radiologist_token}"
            })
            assert response.status_code == 200

    def test_pathology_distribution_unauthenticated(self, client):
        response = client.get("/api/analytics/pathology-distribution")
        assert response.status_code == 403

    def test_time_series_authenticated(self, client, radiologist_token):
        response = client.get("/api/analytics/time-series", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_time_series_with_intervals(self, client, radiologist_token):
        for interval in ["day", "week", "month"]:
            response = client.get(f"/api/analytics/time-series?interval={interval}", headers={
                "Authorization": f"Bearer {radiologist_token}"
            })
            assert response.status_code == 200

    def test_time_series_unauthenticated(self, client):
        response = client.get("/api/analytics/time-series")
        assert response.status_code == 403

    def test_compare_with_params(self, client, radiologist_token):
        response = client.get(
            "/api/analytics/compare?period1_start=2024-01-01&period1_end=2024-06-30&period2_start=2024-07-01&period2_end=2024-12-31",
            headers={"Authorization": f"Bearer {radiologist_token}"}
        )
        assert response.status_code == 200

    def test_compare_unauthenticated(self, client):
        response = client.get("/api/analytics/compare?period1_start=2024-01-01&period1_end=2024-06-30&period2_start=2024-07-01&period2_end=2024-12-31")
        assert response.status_code == 403

    def test_models_stats_authenticated(self, client, radiologist_token):
        response = client.get("/api/analytics/models/stats", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_models_stats_unauthenticated(self, client):
        response = client.get("/api/analytics/models/stats")
        assert response.status_code == 403

    def test_export_json(self, client, radiologist_token):
        response = client.get("/api/analytics/export/json", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_export_csv(self, client, radiologist_token):
        response = client.get("/api/analytics/export/csv", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 200

    def test_export_invalid_format(self, client, radiologist_token):
        response = client.get("/api/analytics/export/pdf", headers={
            "Authorization": f"Bearer {radiologist_token}"
        })
        assert response.status_code == 400

    def test_export_unauthenticated(self, client):
        response = client.get("/api/analytics/export/json")
        assert response.status_code == 403