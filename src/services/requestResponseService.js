import api from './api';

export const requestResponseService = {
  // Get all request responses
  getRequestResponses: async () => {
    const response = await api.get('/RequestResponse');
    return response.data;
  },

  // Get request response by ID
  getRequestResponseById: async (id) => {
    const response = await api.get(`/RequestResponse/${id}`);
    return response.data;
  },

  // Get request responses by request ID
  getRequestResponsesByRequestId: async (requestId) => {
    const response = await api.get(`/RequestResponse/request/${requestId}`);
    return response.data;
  },

  // Search request responses by message
  searchRequestResponses: async (message) => {
    const response = await api.get(`/RequestResponse/search/${encodeURIComponent(message)}`);
    return response.data;
  },

  // Create new request response
  createRequestResponse: async (responseData) => {
    const response = await api.post('/RequestResponse', responseData);
    return response.data;
  },

  // Update request response
  updateRequestResponse: async (id, responseData) => {
    const response = await api.put(`/RequestResponse/${id}`, responseData);
    return response.data;
  },

  // Delete request response
  deleteRequestResponse: async (id) => {
    const response = await api.delete(`/RequestResponse/${id}`);
    return response.data;
  },

  // Mark response as read
  markAsRead: async (messageId) => {
    const response = await api.post(`/RequestResponse/mark-read/${messageId}`);
    return response.data;
  },

  // Mark entire conversation as read
  markConversationAsRead: async (requestId) => {
    const response = await api.post(`/RequestResponse/mark-conversation-read/${requestId}`);
    return response.data;
  },

  // Get unread responses for current user (matches API endpoint)
  getUnreadResponses: async () => {
    const response = await api.get('/RequestResponse/unread');
    return response.data;
  },

  // Get read status for a specific request
  getReadStatus: async (requestId) => {
    const response = await api.get(`/RequestResponse/read-status/${requestId}`);
    return response.data;
  },
};
