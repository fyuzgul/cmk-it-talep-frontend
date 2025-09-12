import React, { useState, useEffect, useCallback } from 'react';
import { useRequests } from '../../hooks/useRequests';
import { useUsers } from '../../hooks/useUsers';
import RequestFilters from './RequestFilters';
import RequestDetailModal from './RequestDetailModal';

const RequestManagement = () => {
  const {
    requests,
    fetchRequests,
    deleteRequest,
    requestTypes,
    requestStatuses,
    requestResponseTypes,
    loading,
    error
  } = useRequests();

  const { users } = useUsers();

  const [filters, setFilters] = useState({
    search: '',
    statusId: '',
    typeId: '',
    responseTypeId: '',
    creatorId: '',
    supportProviderId: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdDate',
    sortOrder: 'desc'
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Load requests function
  const loadRequests = async (customFilters = null, customPage = null) => {
    const params = {
      ...(customFilters || filters),
      page: customPage || currentPage,
      pageSize: pageSize
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    await fetchRequests(params);
  };

  // Initial load
  useEffect(() => {
    loadRequests();
  }, []);

  // Filter changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRequests();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    filters.search,
    filters.statusId,
    filters.typeId,
    filters.responseTypeId,
    filters.creatorId,
    filters.supportProviderId,
    filters.startDate,
    filters.endDate,
    filters.sortBy,
    filters.sortOrder
  ]);

  // Page changes
  useEffect(() => {
    loadRequests();
  }, [currentPage]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteRequest(id);
        await loadRequests();
      } catch (error) {
        console.error('Error deleting request:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const handleRequestUpdated = () => {
    loadRequests();
    handleCloseModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'yeni':
        return 'bg-blue-100 text-blue-800';
      case 'işlemde':
        return 'bg-yellow-100 text-yellow-800';
      case 'tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTypeBadgeClass = (responseTypeName) => {
    switch (responseTypeName?.toLowerCase()) {
      case 'onaylandı':
        return 'bg-green-100 text-green-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Talep Yönetimi</h2>
        <p className="text-gray-600">Sistemdeki tüm talepleri görüntüleyin ve yönetin</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <RequestFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          requestTypes={requestTypes}
          requestStatuses={requestStatuses}
          requestResponseTypes={requestResponseTypes}
          users={users}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Talep Eden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destek Sağlayıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yanıt Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Yükleniyor...' : 'Hiç talep bulunamadı'}
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={request.description}>
                        {request.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requestCreator?.firstName} {request.requestCreator?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.supportProvider?.firstName} {request.supportProvider?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.requestStatus?.name)}`}>
                        {request.requestStatus?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requestType?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResponseTypeBadgeClass(request.requestResponseType?.name)}`}>
                        {request.requestResponseType?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Görüntüle
                        </button>
                        <button
                          onClick={() => handleEditRequest(request)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {requests.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={requests.length < pageSize}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Sayfa <span className="font-medium">{currentPage}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={requests.length < pageSize}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onRequestUpdated={handleRequestUpdated}
          requestTypes={requestTypes}
          requestStatuses={requestStatuses}
          requestResponseTypes={requestResponseTypes}
          users={users}
        />
      )}
    </div>
  );
};

export default RequestManagement;
