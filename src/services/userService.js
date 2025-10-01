import api from './api';

export const userService = {
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

  // Mesajlaşma için ek metodlar
  getAllUsers: async () => {
    const response = await api.get('/User');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/User/${id}`);
    return response.data;
  },

  getUsersByIds: async (ids) => {
    const response = await api.post('/User/GetByIds', { ids });
    return response.data;
  },

  // Silinen kullanıcılar için metodlar
  getDeletedUsers: async () => {
    const response = await api.get('/User/deleted');
    return response.data;
  },

  restoreUser: async (id) => {
    const response = await api.post(`/User/restore/${id}`);
    return response.data;
  },
};

export default userService;
