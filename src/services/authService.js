import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/Auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/Auth/register', userData);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/Auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData) => {
    const response = await api.post('/Auth/reset-password', resetData);
    return response.data;
  },
};
