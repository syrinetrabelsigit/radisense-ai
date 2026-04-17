import api from './api';

class AuthService {
  // ========== LOGIN ==========
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error('No token received');
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { detail: 'Login failed' };
    }
  }

  // ========== REGISTER ==========
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Registration failed' };
    }
  }

  // ========== LOGOUT ==========
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ========== GET CURRENT USER ==========
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ========== GET TOKEN ==========
  getToken() {
    return localStorage.getItem('token');
  }

  // ========== CHECK IF LOGGED IN ==========
  isLoggedIn() {
    return !!this.getToken();
  }

  // ========== UPDATE STORED USER ==========
  updateStoredUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export const authService = new AuthService();
export default authService;