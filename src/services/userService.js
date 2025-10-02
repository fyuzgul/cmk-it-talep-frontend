import api from './api';

export const userService = {
  // Tüm kullanıcıları getir (CC seçimi için)
  async getAllUsers() {
    try {
      const response = await api.get('/User');
      return response.data;
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      throw error;
    }
  },

  // Belirli bir kullanıcıyı getir
  async getUserById(id) {
    try {
      const response = await api.get(`/User/${id}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı bilgisi yüklenirken hata:', error);
      throw error;
    }
  },

  // Departman bazında kullanıcıları getir
  async getUsersByDepartment(departmentId) {
    try {
      const response = await api.get(`/User/department/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Departman kullanıcıları yüklenirken hata:', error);
      throw error;
    }
  },

  // Birden fazla kullanıcıyı ID'lerine göre getir
  async getUsersByIds(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return { success: true, data: [] };
      }
      
      // Backend'de böyle bir endpoint yoksa, tüm kullanıcıları getirip filtreleyelim
      const allUsers = await this.getAllUsers();
      const filteredUsers = allUsers.filter(user => userIds.includes(user.id));
      
      return { success: true, data: filteredUsers };
    } catch (error) {
      console.error('Kullanıcılar ID\'lere göre yüklenirken hata:', error);
      return { success: false, error: error.message };
    }
  },

  // Yeni kullanıcı oluştur
  async createUser(userData) {
    try {
      const response = await api.post('/User', userData);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı oluşturulurken hata:', error);
      throw error;
    }
  },

  // Kullanıcı güncelle
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/User/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata:', error);
      throw error;
    }
  },

  // Kullanıcı sil
  async deleteUser(id) {
    try {
      const response = await api.delete(`/User/${id}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      throw error;
    }
  },

  // Silinen kullanıcıları getir
  async getDeletedUsers() {
    try {
      const response = await api.get('/User/deleted');
      return response.data;
    } catch (error) {
      console.error('Silinen kullanıcılar yüklenirken hata:', error);
      throw error;
    }
  },

  // Kullanıcıyı geri getir
  async restoreUser(id) {
    try {
      const response = await api.post(`/User/restore/${id}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı geri getirilirken hata:', error);
      throw error;
    }
  }
};