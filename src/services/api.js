import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
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

export const commonAPI = {
  getDepartments: async () => {
    const response = await api.get('/Department');
    return response.data;
  },

  createDepartment: async (departmentData) => {
    const response = await api.post('/Department', departmentData);
    return response.data;
  },

  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/Department/${id}`, departmentData);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/Department/${id}`);
    return response.data;
  },

  getRequestResponseTypes: async () => {
    const response = await api.get('/RequestResponseType');
    return response.data;
  },

  createRequestResponseType: async (typeData) => {
    const response = await api.post('/RequestResponseType', typeData);
    return response.data;
  },

  updateRequestResponseType: async (id, typeData) => {
    const response = await api.put(`/RequestResponseType/${id}`, typeData);
    return response.data;
  },

  deleteRequestResponseType: async (id) => {
    const response = await api.delete(`/RequestResponseType/${id}`);
    return response.data;
  },

  getRequestStatuses: async () => {
    const response = await api.get('/RequestStatus');
    return response.data;
  },

  createRequestStatus: async (statusData) => {
    const response = await api.post('/RequestStatus', statusData);
    return response.data;
  },

  updateRequestStatus: async (id, statusData) => {
    const response = await api.put(`/RequestStatus/${id}`, statusData);
    return response.data;
  },

  deleteRequestStatus: async (id) => {
    const response = await api.delete(`/RequestStatus/${id}`);
    return response.data;
  },

  getRequestTypes: async () => {
    const response = await api.get('/RequestType');
    return response.data;
  },

  createRequestType: async (typeData) => {
    const response = await api.post('/RequestType', typeData);
    return response.data;
  },

  updateRequestType: async (id, typeData) => {
    const response = await api.put(`/RequestType/${id}`, typeData);
    return response.data;
  },

  deleteRequestType: async (id) => {
    const response = await api.delete(`/RequestType/${id}`);
    return response.data;
  },

  getSupportTypes: async () => {
    const response = await api.get('/SupportType');
    return response.data;
  },

  createSupportType: async (typeData) => {
    const response = await api.post('/SupportType', typeData);
    return response.data;
  },

  updateSupportType: async (id, typeData) => {
    const response = await api.put(`/SupportType/${id}`, typeData);
    return response.data;
  },

  deleteSupportType: async (id) => {
    const response = await api.delete(`/SupportType/${id}`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/User');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/User', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/User/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/User/${id}`);
    return response.data;
  },

  getUserTypes: async () => {
    const response = await api.get('/UserType');
    return response.data;
  },
};

export default api;
