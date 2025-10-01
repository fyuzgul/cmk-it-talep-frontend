import { useState, useEffect } from 'react';
import api from '../services/api';

export const useUserTypes = () => {
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/UserType');
      setUserTypes(response.data);
    } catch (err) {
      setError(err.message || 'Kullanıcı türleri yüklenirken hata oluştu');
      console.error('useUserTypes fetchUserTypes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTypes();
  }, []);

  return {
    userTypes,
    loading,
    error,
    refetch: fetchUserTypes
  };
};
