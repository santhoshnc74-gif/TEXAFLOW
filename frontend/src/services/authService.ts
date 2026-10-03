import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
const API_URL = `${BASE_URL}/api/auth`;

const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await axios.post(`${API_URL}/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr).user;
  }
  return null;
};

const getToken = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr).access_token;
  }
  return null;
};

const isAuthenticated = () => {
  return !!getToken();
};

const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  getUserRole
};
