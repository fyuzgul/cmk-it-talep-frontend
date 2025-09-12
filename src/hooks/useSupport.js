import { useState, useEffect } from 'react';
import { supportService } from '../services/supportService';

export const useSupport = () => {
  const [supportTypes, setSupportTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSupportTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supportService.getSupportTypes();
      setSupportTypes(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Destek türleri yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSupportType = async (typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supportService.createSupportType(typeData);
      await fetchSupportTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Destek türü oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSupportType = async (id, typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supportService.updateSupportType(id, typeData);
      await fetchSupportTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Destek türü güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSupportType = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supportService.deleteSupportType(id);
      await fetchSupportTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Destek türü silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportTypes();
  }, []);

  return {
    supportTypes,
    loading,
    error,
    fetchSupportTypes,
    createSupportType,
    updateSupportType,
    deleteSupportType,
  };
};
