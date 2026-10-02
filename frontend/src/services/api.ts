import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001',
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Optionally handle token expiration by logging out
    if (window.location.pathname !== '/login') {
      authService.logout();
    }
  }
  return Promise.reject(error);
});

export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export const checkDatabaseHealth = async () => {
  const response = await api.get('/api/database/health');
  return response.data;
};

export default api;
