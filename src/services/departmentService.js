import api from './api';

export const departmentService = {
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
};
