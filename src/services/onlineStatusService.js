import api from './api';

export const onlineStatusService = {
  // Get all online users
  getOnlineUsers: async () => {
    const response = await api.get('/OnlineStatus/online-users');
    return response.data;
  },

  // Check if a specific user is online
  checkUserOnlineStatus: async (userId) => {
    const response = await api.get(`/OnlineStatus/user/${userId}/is-online`);
    return response.data;
  },

  // Update last seen timestamp
  updateLastSeen: async () => {
    const response = await api.post('/OnlineStatus/update-last-seen');
    return response.data;
  },

  // Set user as online (for testing purposes)
  setUserOnline: async (userId) => {
    const response = await api.post(`/OnlineStatus/set-online/${userId}`);
    return response.data;
  },

  // Set user as offline
  setUserOffline: async (userId) => {
    const response = await api.post(`/OnlineStatus/set-offline/${userId}`);
    return response.data;
  },

  // Get read status for a specific request
  getReadStatus: async (requestId) => {
    const response = await api.get(`/RequestResponse/read-status/${requestId}`);
    return response.data;
  },

  // Get all unread messages for current user
  getUnreadMessages: async () => {
    const response = await api.get('/RequestResponse/unread');
    return response.data;
  }
};
