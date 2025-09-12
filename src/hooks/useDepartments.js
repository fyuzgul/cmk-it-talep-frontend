import { useState, useEffect } from 'react';
import { departmentService } from '../services/departmentService';

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentService.getDepartments();
      setDepartments(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Departmanlar yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (departmentData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await departmentService.createDepartment(departmentData);
      await fetchDepartments(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Departman oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async (id, departmentData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await departmentService.updateDepartment(id, departmentData);
      await fetchDepartments(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Departman güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await departmentService.deleteDepartment(id);
      await fetchDepartments(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Departman silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
};
