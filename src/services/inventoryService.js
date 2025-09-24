import api from './api';

const inventoryService = {
  // Get all inventories
  getAllInventories: async () => {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventories:', error);
      throw error;
    }
  },

  // Get inventory by ID
  getInventoryById: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Create new inventory
  createInventory: async (inventoryData) => {
    try {
      console.log('Sending POST request to /inventory with data:', inventoryData);
      const response = await api.post('/inventory', inventoryData);
      console.log('Inventory creation response:', response);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  },

  // Update inventory
  updateInventory: async (id, inventoryData) => {
    try {
      console.log('Updating inventory with ID:', id);
      console.log('Inventory data:', inventoryData);
      
      // Ensure the ID is included in the data
      const dataWithId = { ...inventoryData, id: parseInt(id) };
      console.log('Data with ID:', dataWithId);
      
      const response = await api.put(`/inventory/${id}`, dataWithId);
      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      console.error('Error response data:', error.response?.data);
      throw error;
    }
  },

  // Delete inventory
  deleteInventory: async (id) => {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }
};

export default inventoryService;
