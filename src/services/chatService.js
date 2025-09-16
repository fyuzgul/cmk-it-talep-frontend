import apiClient from './apiClient';

class ChatService {
  // Mesajlaşma taleplerini getir
  async getChatRequests() {
    try {
      const response = await apiClient.get('/chat/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat requests:', error);
      throw error;
    }
  }

  // Belirli bir talebin mesajlarını getir
  async getRequestMessages(requestId) {
    try {
      const response = await apiClient.get(`/chat/requests/${requestId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching request messages:', error);
      throw error;
    }
  }

  // Talebe mesaj gönder
  async sendRequestMessage(requestId, message, filePath = null) {
    try {
      const response = await apiClient.post(`/chat/requests/${requestId}/messages`, {
        message,
        filePath
      });
      return response.data;
    } catch (error) {
      console.error('Error sending request message:', error);
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId) {
    try {
      const response = await apiClient.post(`/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Kullanıcının çevrimiçi olup olmadığını kontrol et
  async isUserOnline(userId) {
    try {
      const response = await apiClient.get(`/chat/users/${userId}/online`);
      return response.data;
    } catch (error) {
      console.error('Error checking user online status:', error);
      throw error;
    }
  }

  // Çevrimiçi kullanıcıları getir
  async getOnlineUsers() {
    try {
      const response = await apiClient.get('/chat/users/online');
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
