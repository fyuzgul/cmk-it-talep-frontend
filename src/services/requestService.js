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

  // Request Management
  getRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.supportProviderId) queryParams.append('supportProviderId', params.supportProviderId);
    if (params.requestCreatorId) queryParams.append('requestCreatorId', params.requestCreatorId);
    if (params.requestStatusId) queryParams.append('requestStatusId', params.requestStatusId);
    if (params.requestTypeId) queryParams.append('requestTypeId', params.requestTypeId);
    if (params.requestResponseTypeId) queryParams.append('requestResponseTypeId', params.requestResponseTypeId);
    if (params.description) queryParams.append('description', params.description);
    if (params.search) queryParams.append('description', params.search); // search parametresini description olarak gönder
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = queryString ? `/Request?${queryString}` : '/Request';
    
    const response = await api.get(url);
    return response.data;
  },

  getRequestById: async (id) => {
    const response = await api.get(`/Request/${id}`);
    return response.data;
  },

  createRequest: async (requestData) => {
    const response = await api.post('/Request', requestData);
    return response.data;
  },

  updateRequest: async (id, requestData) => {
    const response = await api.put(`/Request/${id}`, requestData);
    return response.data;
  },

  deleteRequest: async (id) => {
    const response = await api.delete(`/Request/${id}`);
    return response.data;
  },

  // Request filtering methods
  getRequestsBySupportProvider: async (supportProviderId) => {
    const response = await api.get(`/Request/supportprovider/${supportProviderId}`);
    return response.data;
  },

  getRequestsByCreator: async (requestCreatorId) => {
    const response = await api.get(`/Request/creator/${requestCreatorId}`);
    return response.data;
  },

  getRequestsByStatus: async (requestStatusId) => {
    const response = await api.get(`/Request/status/${requestStatusId}`);
    return response.data;
  },

  getRequestsByType: async (requestTypeId) => {
    const response = await api.get(`/Request/type/${requestTypeId}`);
    return response.data;
  },

  getRequestsByResponseType: async (requestResponseTypeId) => {
    const response = await api.get(`/Request/responsetype/${requestResponseTypeId}`);
    return response.data;
  },

  searchRequests: async (description) => {
    const response = await api.get(`/Request/search/${encodeURIComponent(description)}`);
    return response.data;
  },
};
