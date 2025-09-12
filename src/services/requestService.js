import api from './api';

export const requestService = {
  // Request Types
  getRequestTypes: async () => {
    const response = await api.get('/RequestType');
    console.log('API: Request types response count:', response.data?.length || 0);
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

  // Request Statuses
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

  // Request Response Types
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
};
