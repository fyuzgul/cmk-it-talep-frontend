import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import signalrService from '../../services/signalrService';

const MyRequests = () => {
  const { user } = useAuth();
  const { 
    requests, 
    requestTypes, 
    requestStatuses, 
    getRequestsByCreator, 
    loading, 
    error 
  } = useRequests();

  const [filteredRequests, setFilteredRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const loadUserRequests = useCallback(async () => {
    if (user?.id) {
      await getRequestsByCreator(user.id);
    }
  }, [user?.id, getRequestsByCreator]);

  useEffect(() => {
    loadUserRequests();
  }, [loadUserRequests]);

  // Çevrimiçi kullanıcıları takip et - global state kullan
  useEffect(() => {
    // Global online users state'ini al
    setOnlineUsers(signalrService.getOnlineUsersList());
    
    // SignalR bağlantısı kontrolü
    if (signalrService.isConnected) {
      console.log('🔵 MyRequests - SignalR connected, waiting for online users...');
    } else {
      console.log('❌ MyRequests - SignalR not connected');
    }

    // Global state değişikliklerini dinle
    const handleOnlineUsersChange = () => {
      setOnlineUsers(signalrService.getOnlineUsersList());
    };

    // Event listeners'ı kaydet
    signalrService.on('user:online', handleOnlineUsersChange);
    signalrService.on('user:offline', handleOnlineUsersChange);
    signalrService.on('online:users', handleOnlineUsersChange);

    // Cleanup
    return () => {
      signalrService.off('user:online', handleOnlineUsersChange);
      signalrService.off('user:offline', handleOnlineUsersChange);
      signalrService.off('online:users', handleOnlineUsersChange);
    };
  }, []);

  // Mesajlaşma için SignalR event listeners
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('New message received in MyRequests:', message);
      if (message.RequestId === selectedRequest?.id) {
        setMessages(prev => [...prev, message]);
      }
    };

    if (showChatModal && signalrService.isConnected) {
      signalrService.on('message:new', handleNewMessage);
    }

    return () => {
      if (signalrService.isConnected) {
        signalrService.off('message:new', handleNewMessage);
      }
    };
  }, [showChatModal, selectedRequest?.id]);

  useEffect(() => {
    let filtered = requests;

    if (filters.status) {
      filtered = filtered.filter(req => req.requestStatusId === parseInt(filters.status));
    }

    if (filters.type) {
      filtered = filtered.filter(req => req.requestTypeId === parseInt(filters.type));
    }

    if (filters.search) {
      filtered = filtered.filter(req => 
        req.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadgeColor = (statusId) => {
    const status = requestStatuses.find(s => s.id === statusId);
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status.name?.toLowerCase()) {
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800';
      case 'işlemde':
        return 'bg-blue-100 text-blue-800';
      case 'tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Kullanıcının çevrimiçi olup olmadığını kontrol et
  const isUserOnline = (userId) => {
    const isOnline = onlineUsers.includes(userId);
    console.log(`🔍 MyRequests - isUserOnline(${userId}): ${isOnline}, onlineUsers:`, onlineUsers);
    return isOnline;
  };

  // Mesajlaşma fonksiyonları
  const handleOpenChat = (request) => {
    setSelectedRequest(request);
    setShowChatModal(true);
    setMessages([]);
    setNewMessage('');
    
    // SignalR ile odaya katıl
    if (signalrService.isConnected) {
      signalrService.joinRoom(`request_${request.id}`);
    }
  };

  const handleCloseChat = () => {
    if (selectedRequest && signalrService.isConnected) {
      signalrService.leaveRoom(`request_${selectedRequest.id}`);
    }
    setShowChatModal(false);
    setSelectedRequest(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      // SignalR ile mesaj gönder
      if (signalrService.isConnected) {
        await signalrService.sendMessageToGroup(`request_${selectedRequest.id}`, {
          RequestId: selectedRequest.id,
          Message: newMessage.trim(),
          UserId: user?.id,
          SenderName: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.firstName || 'Kullanıcı',
          Timestamp: new Date().toISOString()
        });
        
        setNewMessage('');
        console.log('✅ Message sent via SignalR');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  const getTypeName = (typeId, types) => {
    const type = types.find(t => t.id === typeId);
    return type?.name || 'Bilinmiyor';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Taleplerim</h2>
        <p className="text-gray-600">Oluşturduğunuz tüm talepleri buradan görüntüleyebilirsiniz.</p>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Durumlar</option>
              {requestStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Talep Türü
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Türler</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Açıklamada ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Talep Listesi */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Henüz talep oluşturmamışsınız</div>
            <p className="text-gray-400">İlk talebinizi oluşturmak için "Yeni Talep" butonunu kullanın.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturma Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Güncelleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destek Sağlayıcısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeName(request.requestTypeId, requestTypes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={request.description}>
                        {request.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(request.requestStatusId)}`}>
                        {getTypeName(request.requestStatusId, requestStatuses)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.modifiedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.supportProvider ? (
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {request.supportProvider.firstName?.charAt(0) || 'D'}
                            </div>
                            {/* Çevrimiçi durumu göstergesi */}
                            {isUserOnline(request.supportProvider.id) && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">
                                {request.supportProvider.firstName} {request.supportProvider.lastName}
                              </span>
                              {isUserOnline(request.supportProvider.id) && (
                                <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Atanmamış</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.supportProvider && (
                        <button
                          onClick={() => handleOpenChat(request)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Mesajlaş
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* İstatistikler */}
      {filteredRequests.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Talep İstatistikleri</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold">{filteredRequests.length}</div>
                  <div className="text-indigo-100 text-sm font-medium">Toplam Talep</div>
                </div>
                <div className="ml-4">
                  <svg className="w-8 h-8 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {requestStatuses.map((status) => {
              const count = filteredRequests.filter(req => req.requestStatusId === status.id).length;
              const statusColors = {
                1: 'from-gray-400 to-gray-500',    // Yeni
                2: 'from-blue-400 to-blue-500',   // İşlemde
                3: 'from-yellow-400 to-yellow-500', // Beklemede
                4: 'from-green-500 to-green-600',  // Çözüldü
                5: 'from-red-500 to-red-600'       // Kapalı
              };
              const iconColors = {
                1: 'text-gray-200',    // Yeni
                2: 'text-blue-200',    // İşlemde
                3: 'text-yellow-200',  // Beklemede
                4: 'text-green-100',   // Çözüldü
                5: 'text-red-100'      // Kapalı
              };
              const icons = {
                1: 'M12 6v6m0 0v6m0-6h6m-6 0H6',  // Yeni - Plus icon
                2: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', // İşlemde - Refresh icon
                3: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // Beklemede - Clock icon
                4: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // Çözüldü - Check circle icon
                5: 'M6 18L18 6M6 6l12 12' // Kapalı - X icon
              };
              
              const bgColor = statusColors[status.id] || 'from-gray-400 to-gray-500';
              const iconColor = iconColors[status.id] || 'text-gray-200';
              const iconPath = icons[status.id] || 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
              
              return (
                <div key={status.id} className={`bg-gradient-to-r ${bgColor} p-6 rounded-lg shadow-lg text-white`}>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-3xl font-bold">{count}</div>
                      <div className="text-white text-sm font-medium opacity-90">{status.name}</div>
                    </div>
                    <div className="ml-4">
                      <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mesajlaşma Modal */}
      {showChatModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Talep #{selectedRequest.id} - Mesajlaşma
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.supportProvider?.firstName} {selectedRequest.supportProvider?.lastName} ile mesajlaşın
                  </p>
                </div>
                <button
                  onClick={handleCloseChat}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 border-b border-gray-200">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Henüz mesaj yok. İlk mesajı siz gönderin!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.UserId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.UserId === user?.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.SenderName || 'Bilinmeyen'}
                          </span>
                          <span className="text-xs opacity-75">
                            {new Date(message.Timestamp).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{message.Message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
