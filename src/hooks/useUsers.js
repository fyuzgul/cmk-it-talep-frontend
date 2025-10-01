import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useUserTypes } from './useUserTypes';
import { useDepartments } from './useDepartments';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UserTypes ve Departments hook'larını kullan
  const { userTypes } = useUserTypes();
  const { departments } = useDepartments();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message || 'Kullanıcılar yüklenirken hata oluştu');
      console.error('useUsers fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const newUser = await userService.createUser(userData);
      await fetchUsers(); // Listeyi yenile
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const updatedUser = await userService.updateUser(id, userData);
      await fetchUsers(); // Listeyi yenile
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      await userService.deleteUser(id);
      await fetchUsers(); // Listeyi yenile
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    userTypes,
    departments,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};