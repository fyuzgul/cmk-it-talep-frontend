const API_BASE_URL = 'https://localhost:7097/api';

class PriorityLevelService {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/PriorityLevel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/PriorityLevel/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  async create(priorityLevel) {
    try {
      const response = await fetch(`${API_BASE_URL}/PriorityLevel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(priorityLevel)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  async update(id, priorityLevel) {
    try {
      const response = await fetch(`${API_BASE_URL}/PriorityLevel/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(priorityLevel)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Console log removed
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/PriorityLevel/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      // Console log removed
      throw error;
    }
  }
}

export default new PriorityLevelService();
