import api from './api';

class PriorityLevelService {
  async getAll() {
    try {
      const response = await api.get('/PriorityLevel');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await api.get(`/PriorityLevel/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async create(priorityLevel) {
    try {
      const response = await api.post('/PriorityLevel', priorityLevel);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async update(id, priorityLevel) {
    try {
      const response = await api.put(`/PriorityLevel/${id}`, priorityLevel);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      await api.delete(`/PriorityLevel/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default new PriorityLevelService();
