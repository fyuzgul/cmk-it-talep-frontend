import { useState, useEffect, useCallback } from 'react';
import { requestResponseService } from '../services/requestResponseService';

export const useRequestResponses = () => {
  const [requestResponses, setRequestResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequestResponses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestResponseService.getRequestResponses();
      setRequestResponses(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtları yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequestResponsesByRequestId = useCallback(async (requestId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestResponseService.getRequestResponsesByRequestId(requestId);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtları yüklenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchRequestResponses = useCallback(async (message) => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestResponseService.searchRequestResponses(message);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtları aranırken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequestResponse = useCallback(async (responseData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestResponseService.createRequestResponse(responseData);
      // ✅ SignalR ile gerçek zamanlı güncelleme yapılacak, gereksiz veri yükleme yok
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtı oluşturulurken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequestResponse = useCallback(async (id, responseData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestResponseService.updateRequestResponse(id, responseData);
      // ✅ SignalR ile gerçek zamanlı güncelleme yapılacak, gereksiz veri yükleme yok
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtı güncellenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRequestResponse = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestResponseService.deleteRequestResponse(id);
      // ✅ SignalR ile gerçek zamanlı güncelleme yapılacak, gereksiz veri yükleme yok
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Talep yanıtı silinirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (messageId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestResponseService.markAsRead(messageId);
      // ✅ SignalR ile gerçek zamanlı güncelleme yapılacak, gereksiz veri yükleme yok
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Mesaj okundu olarak işaretlenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markConversationAsRead = useCallback(async (requestId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestResponseService.markConversationAsRead(requestId);
      // ✅ SignalR ile gerçek zamanlı güncelleme yapılacak, gereksiz veri yükleme yok
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Konuşma okundu olarak işaretlenirken bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUnreadResponses = useCallback(async () => {
    try {
      setError(null);
      const result = await requestResponseService.getUnreadResponses();
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Okunmamış mesajlar alınırken bir hata oluştu');
      throw err;
    }
  }, []);

  const getReadStatus = useCallback(async (requestId) => {
    try {
      setError(null);
      const result = await requestResponseService.getReadStatus(requestId);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Okuma durumu alınırken bir hata oluştu');
      throw err;
    }
  }, []);

  return {
    requestResponses,
    loading,
    error,
    fetchRequestResponses,
    getRequestResponsesByRequestId,
    searchRequestResponses,
    createRequestResponse,
    updateRequestResponse,
    deleteRequestResponse,
    markAsRead,
    markConversationAsRead,
    getUnreadResponses,
    getReadStatus,
  };
};
