import api from './api';

class UserService {
  // ========== PROFILE MANAGEMENT ==========
  
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch profile' };
    }
  }

  async updateProfile(userData) {
    try {
      const response = await api.put('/users/profile', userData);
      
      // Update localStorage
      const authService = require('./authService').default;
      authService.updateStoredUser(response.data);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update profile' };
    }
  }

  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload avatar' };
    }
  }

  // ========== ACCOUNT SETTINGS ==========

  async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/users/settings/notifications', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update notification settings' };
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await api.post('/users/settings/password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to change password' };
    }
  }

  async toggleTwoFactor(enabled) {
    try {
      const response = await api.put('/users/settings/2fa', null, {
        params: { enabled }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update 2FA settings' };
    }
  }

  async deleteAccount() {
    try {
      const response = await api.delete('/users/account');
      
      // Logout after account deletion
      const authService = require('./authService').default;
      authService.logout();
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete account' };
    }
  }
}

export const userService = new UserService();
export default userService;