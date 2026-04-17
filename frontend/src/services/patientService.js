import api from './api';

class PatientService {
  // ========== PATIENT MANAGEMENT ==========

  async getPatients(params = {}) {
    try {
      const response = await api.get('/patients/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch patients' };
    }
  }

  async getPatient(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch patient' };
    }
  }

  async createPatient(patientData) {
    try {
      const response = await api.post('/patients/', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create patient' };
    }
  }

  async updatePatient(patientId, patientData) {
    try {
      const response = await api.put(`/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update patient' };
    }
  }

  async deletePatient(patientId) {
    try {
      const response = await api.delete(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete patient' };
    }
  }

  // ✅ NOUVEAU: VÉRIFIER SI NATIONAL_ID EXISTE
  async checkNationalId(nationalId) {
    try {
      const response = await api.get(`/patients/check-national-id/${nationalId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to check national ID' };
    }
  }

  // ========== PATIENT ANALYSES ==========

  async getPatientAnalyses(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/analyses`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch patient analyses' };
    }
  }
}

export const patientService = new PatientService();
export default patientService;