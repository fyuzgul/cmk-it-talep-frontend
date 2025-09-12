import { useState, useEffect } from 'react';
import { requestService } from '../services/requestService';

export const useRequests = () => {
  const [requestTypes, setRequestTypes] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [requestResponseTypes, setRequestResponseTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request Types
  const fetchRequestTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getRequestTypes();
      console.log('Hook: Fetched request types count:', data?.length || 0);
      setRequestTypes(data);
      return data;
    } catch (err) {
      console.error('Error fetching request types:', err);
      setError(err.response?.data?.message || 'Talep türleri yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRequestType = async (typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.createRequestType(typeData);
      await fetchRequestTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep türü oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequestType = async (id, typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.updateRequestType(id, typeData);
      await fetchRequestTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep türü güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequestType = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.deleteRequestType(id);
      await fetchRequestTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep türü silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request Statuses
  const fetchRequestStatuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getRequestStatuses();
      setRequestStatuses(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep durumları yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRequestStatus = async (statusData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.createRequestStatus(statusData);
      await fetchRequestStatuses(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep durumu oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id, statusData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.updateRequestStatus(id, statusData);
      await fetchRequestStatuses(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep durumu güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequestStatus = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.deleteRequestStatus(id);
      await fetchRequestStatuses(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep durumu silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request Response Types
  const fetchRequestResponseTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getRequestResponseTypes();
      setRequestResponseTypes(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep/İstek türleri yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRequestResponseType = async (typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.createRequestResponseType(typeData);
      await fetchRequestResponseTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep/İstek türü oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequestResponseType = async (id, typeData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.updateRequestResponseType(id, typeData);
      await fetchRequestResponseTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep/İstek türü güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequestResponseType = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.deleteRequestResponseType(id);
      await fetchRequestResponseTypes(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep/İstek türü silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request Management
  const fetchRequests = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getRequests(params);
      setRequests(data);
      return data;
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Talepler yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRequestById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getRequestById(id);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep detayları yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.createRequest(requestData);
      await fetchRequests(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (id, requestData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.updateRequest(id, requestData);
      await fetchRequests(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestService.deleteRequest(id);
      await fetchRequests(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchRequestTypes(),
          fetchRequestStatuses(),
          fetchRequestResponseTypes()
        ]);
      } catch (err) {
        setError(err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    // Request Types
    requestTypes,
    fetchRequestTypes,
    createRequestType,
    updateRequestType,
    deleteRequestType,
    
    // Request Statuses
    requestStatuses,
    fetchRequestStatuses,
    createRequestStatus,
    updateRequestStatus,
    deleteRequestStatus,
    
    // Request Response Types
    requestResponseTypes,
    fetchRequestResponseTypes,
    createRequestResponseType,
    updateRequestResponseType,
    deleteRequestResponseType,
    
    // Request Management
    requests,
    fetchRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    
    // Common
    loading,
    error,
  };
};
