import React, { useState, useEffect, useCallback } from 'react';
import { useRequests } from '../../hooks/useRequests';
import { useUsers } from '../../hooks/useUsers';
import { usePriorityLevels } from '../../hooks/usePriorityLevels';
import RequestFilters from './RequestFilters';

const RequestManagement = () => {
  const {
    requests,
    fetchRequests,
    deleteRequest,
    requestTypes,
    requestStatuses,
    loading,
    error
  } = useRequests();

  const { users } = useUsers();
  const { priorityLevels } = usePriorityLevels();

  const [filters, setFilters] = useState({
    search: '',
    statusId: '',
    typeId: '',
    priorityId: '',
    creatorId: '',
    supportProviderId: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdDate',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Initial load
  useEffect(() => {
    const params = {
      ...filters,
      page: currentPage,
      pageSize: pageSize
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    fetchRequests(params).catch(error => {
      // Error fetching requests on initial load - silent fail
    });
  }, []);

  // Çevrimiçi kullanıcıları yükle - şimdilik devre dışı
  // useEffect(() => {
  //   fetchOnlineUsers().catch(() => {});
  // }, []);

  // Filtrelenmiş talepler - MessageManagement gibi client-side filtreleme
  const allFilteredRequests = requests.filter(request => {
    if (filters.search && !request.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.statusId && request.requestStatusId !== parseInt(filters.statusId)) {
      return false;
    }
    if (filters.typeId && request.requestTypeId !== parseInt(filters.typeId)) {
      return false;
    }
    if (filters.priorityId && request.priorityLevelId !== parseInt(filters.priorityId)) {
      return false;
    }
    if (filters.creatorId && request.requestCreatorId !== parseInt(filters.creatorId)) {
      return false;
    }
    if (filters.supportProviderId && request.supportProviderId !== parseInt(filters.supportProviderId)) {
      return false;
    }
    if (filters.startDate) {
      const requestDate = new Date(request.createdDate);
      const startDate = new Date(filters.startDate);
      if (requestDate < startDate) {
        return false;
      }
    }
    if (filters.endDate) {
      const requestDate = new Date(request.createdDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      if (requestDate > endDate) {
        return false;
      }
    }
    return true;
  });

  // Sıralama
  const sortedRequests = [...allFilteredRequests].sort((a, b) => {
    const aValue = a[filters.sortBy] || a.createdDate;
    const bValue = b[filters.sortBy] || b.createdDate;
    
    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Sayfalama
  const totalPages = Math.ceil(sortedRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const filteredRequests = sortedRequests.slice(startIndex, endIndex);

  // Sayfa değişiklikleri artık client-side filtreleme ile yönetiliyor

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };


  const handleDeleteRequest = async (id) => {
    if (window.confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteRequest(id);
        await loadRequests();
      } catch (error) {
        // Error deleting request - silent fail
      }
    }
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

  // Kullanıcının çevrimiçi olup olmadığını kontrol et - şimdilik devre dışı
  const isUserOnline = (userId) => {
    if (!userId) return false;
    
    // Şimdilik her zaman false döndür - çevrimiçi kullanıcı özelliği henüz aktif değil
    return false;
    
    // Gelecekte SignalR entegrasyonu için:
    // const usersToCheck = signalrConnected && signalrOnlineUsers.length > 0 ? signalrOnlineUsers : onlineUsers;
    // if (!usersToCheck || usersToCheck.length === 0) return false;
    // return usersToCheck.some(onlineUser => {
    //   const onlineUserId = onlineUser.userId || onlineUser.id || onlineUser;
    //   return onlineUserId === userId && onlineUser.isOnline === true;
    // });
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

  const getPriorityBadgeClass = (priorityId) => {
    const priority = priorityLevels.find(p => p.id === priorityId);
    if (!priority) return 'bg-gray-100 text-gray-800';

    switch (priority.name?.toLowerCase()) {
      case 'acil':
        return 'bg-red-100 text-red-800';
      case 'öncelikli':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'düşük':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityName = (priorityId) => {
    const priority = priorityLevels.find(p => p.id === priorityId);
    return priority?.name || 'Bilinmiyor';
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Loading */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Filters Loading */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Loading */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                        <div className="space-y-2 mb-4">
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-start lg:items-end space-x-2 lg:space-x-0 lg:space-y-2">
                        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Talep Yönetimi</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Sistemdeki tüm talepleri görüntüleyin ve yönetin</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {sortedRequests.length} talep
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
        <RequestFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          requestTypes={requestTypes}
          requestStatuses={requestStatuses}
          priorityLevels={priorityLevels}
          users={users}
        />

        {/* Modern Card Layout */}
        <div className="p-4 sm:p-6 relative">
          {loading && requests.length > 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
              <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-lg shadow-lg border">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="text-sm font-medium text-gray-700">Veriler güncelleniyor...</span>
              </div>
            </div>
          )}
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">
                {loading ? 'Yükleniyor...' : 'Hiç talep bulunamadı'}
              </h3>
              <p className="mt-1 sm:mt-2 text-sm text-gray-500">
                {loading ? 'Talepler yükleniyor...' : 'Filtreleri değiştirerek daha fazla talep bulabilirsiniz.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      {/* Talep Açıklaması */}
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {request.description}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {request.requestType?.name || 'Tür belirtilmemiş'}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {getPriorityName(request.priorityLevelId)}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(request.createdDate)}
                          </span>
                        </div>
                      </div>

                      {/* Kullanıcı Bilgileri */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        {/* Talep Eden */}
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-lg">
                              {request.requestCreator?.firstName?.charAt(0) || 'U'}
                            </div>
                            {isUserOnline(request.requestCreator?.id) && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {request.requestCreator ? 
                                `${request.requestCreator.firstName} ${request.requestCreator.lastName}` : 
                                'Bilinmiyor'
                              }
                            </p>
                            <p className="text-xs text-gray-500">Talep Eden</p>
                            {isUserOnline(request.requestCreator?.id) && (
                              <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                            )}
                          </div>
                        </div>

                        {/* Destek Sağlayıcı */}
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-lg">
                              {request.supportProvider?.firstName?.charAt(0) || 'D'}
                            </div>
                            {isUserOnline(request.supportProvider?.id) && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {request.supportProvider ? 
                                `${request.supportProvider.firstName} ${request.supportProvider.lastName}` : 
                                'Atanmamış'
                              }
                            </p>
                            <p className="text-xs text-gray-500">Destek Sağlayıcı</p>
                            {isUserOnline(request.supportProvider?.id) && (
                              <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Durum ve Öncelik */}
                    <div className="flex flex-row lg:flex-col items-start lg:items-end space-x-2 lg:space-x-0 lg:space-y-2">
                      <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusBadgeClass(request.requestStatus?.name)}`}>
                        {request.requestStatus?.name || '-'}
                      </span>
                      <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getPriorityBadgeClass(request.priorityLevelId)}`}>
                        {getPriorityName(request.priorityLevelId)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredRequests.length > 0 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, sortedRequests.length)}</span> / <span className="font-medium">{sortedRequests.length}</span> talep
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500">Sayfa:</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{currentPage} / {totalPages}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Önceki</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <span className="hidden sm:inline">Sonraki</span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  );
};

export default RequestManagement;
