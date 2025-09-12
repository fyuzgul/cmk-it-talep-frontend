import api from './api';

export const supportService = {
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
};
