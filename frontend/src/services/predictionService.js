import api from './api';

class PredictionService {
  // ========== UPLOAD & PREDICT ==========

  async uploadAndPredict(file, patientId = null, notes = null, model = 'mobilenet', pendingId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (patientId) {
        formData.append('patient_id', patientId);
      }
      
      if (notes) {
        formData.append('notes', notes);
      }

      formData.append('model_name', model);

      if (pendingId) {
        formData.append('pending_id', pendingId);
      }

      const response = await api.post('/predict/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for ML processing
      });

      return response.data;
    } catch (error) {
      const err = error.response?.data || { detail: 'Failed to process image' };
      err.status = error.response?.status;
      throw err;
    }
  }

  // ========== GET PREDICTIONS ==========

  async getPredictions(params = {}) {
    try {
      const response = await api.get('/predict/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch predictions' };
    }
  }

  async getPrediction(predictionId) {
    try {
      const response = await api.get(`/predict/${predictionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch prediction' };
    }
  }

  // ========== ANALYTICS ==========

  async getStats() {
    try {
      const response = await api.get('/predict/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch statistics' };
    }
  }

  // ========== DELETE ==========

  async deletePrediction(predictionId) {
    try {
      const response = await api.delete(`/predict/${predictionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete prediction' };
    }
  }
}

export const predictionService = new PredictionService();
export default predictionService;