import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcılar yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserTypes();
      setUserTypes(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcı türleri yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.createUser(userData);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.updateUser(id, userData);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcı güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.deleteUser(id);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, userTypesData] = await Promise.all([
        userService.getUsers(),
        userService.getUserTypes()
      ]);
      setUsers(usersData);
      setUserTypes(userTypesData);
      return { users: usersData, userTypes: userTypesData };
    } catch (err) {
      setError(err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    userTypes,
    loading,
    error,
    fetchUsers,
    fetchUserTypes,
    fetchData,
    createUser,
    updateUser,
    deleteUser,
  };
};
