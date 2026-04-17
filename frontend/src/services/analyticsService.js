import api from './api';

class AnalyticsService {
  // ========== DASHBOARD STATS ==========

  async getDashboardStats() {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch dashboard stats' };
    }
  }

  // ========== PERFORMANCE METRICS ==========

  async getPerformanceMetrics(params = {}) {
    try {
      const response = await api.get('/analytics/performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch performance metrics' };
    }
  }

  // ========== PATHOLOGY DISTRIBUTION ==========

  async getPathologyDistribution(params = {}) {
    try {
      const response = await api.get('/analytics/pathology-distribution', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch pathology distribution' };
    }
  }

  // ========== TIME SERIES ==========

  async getTimeSeries(params = {}) {
    try {
      const response = await api.get('/analytics/time-series', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch time series' };
    }
  }

  // ========== MODEL STATS ========== ✅ NOUVEAU !

  async getModelStats() {
    try {
      const response = await api.get('/analytics/models/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch model stats' };
    }
  }

  // ========== EXPORT ==========

  async exportReport(format, params = {}) {
    try {
      const response = await api.get(`/analytics/export/${format}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to export report' };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;