import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useRequestResponses } from '../../hooks/useRequestResponses';
import { useSocket } from '../../hooks/useSocket';
import signalrService from '../../services/signalrService';
import toast from 'react-hot-toast';

const MessageManagement = () => {
  const { user } = useAuth();
  const {
    requests,
    requestTypes, 
    requestStatuses, 
    fetchRequests 
  } = useRequests();
  const { 
    getRequestResponsesByRequestId, 
    createRequestResponse, 
    markAsRead,
    markConversationAsRead,
    loading: responseLoading 
  } = useRequestResponses();
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestResponses, setRequestResponses] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    statusId: '',
    typeId: ''
  });
  const [responseForm, setResponseForm] = useState({
    message: '',
    filePath: ''
  });
  const [messagesEndRef, setMessagesEndRef] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Support kullanıcısının taleplerini yükle
  const loadSupportRequests = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user.id found, skipping support request loading');
      return;
    }
    
    console.log('🔄 Loading support requests for user.id:', user.id);
    
    try {
      setLoading(true);
      console.log('📡 Calling fetchRequests API with supportProviderId...');
      const supportRequests = await fetchRequests({
        supportProviderId: user?.id,
        pageSize: 100
      });
      console.log('✅ API Response - Loaded support requests:', supportRequests);
      console.log('📊 Support request count:', supportRequests?.length || 0);
      
      // API'den gelen veriyi direkt kullan
      if (supportRequests && supportRequests.length > 0) {
        console.log('✅ Using API response directly');
        setSupportRequests(supportRequests);
      } else {
        console.log('⚠️ No support requests found in API response');
        setSupportRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading support requests:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      toast.error('Talepler yüklenirken bir hata oluştu.');
      setSupportRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchRequests]);

  // Seçili talebin cevaplarını yükle
  const loadRequestResponses = useCallback(async (requestId) => {
    try {
      const responses = await getRequestResponsesByRequestId(requestId);
      setRequestResponses(responses || []);
      
      // Tüm konuşmayı okundu olarak işaretle (daha verimli)
      try {
        await markConversationAsRead(requestId);
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    } catch (error) {
      console.error('Error loading request responses:', error);
      toast.error('Cevaplar yüklenirken bir hata oluştu.');
    }
  }, [getRequestResponsesByRequestId, markConversationAsRead]);

  useEffect(() => {
    if (user?.id) {
      loadSupportRequests();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadSupportRequests]);

  // Çevrimiçi kullanıcıları takip et
  useEffect(() => {
    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(userIds);
    };

    const handleUserOnline = (data) => {
      setOnlineUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    // Event listeners'ı kaydet
    signalrService.on('online:users', handleOnlineUsers);
    signalrService.on('user:online', handleUserOnline);
    signalrService.on('user:offline', handleUserOffline);

    // Çevrimiçi kullanıcıları getir
    if (signalrService.isConnected) {
      signalrService.getOnlineUsers();
    }

    // Cleanup
    return () => {
      signalrService.off('online:users', handleOnlineUsers);
      signalrService.off('user:online', handleUserOnline);
      signalrService.off('user:offline', handleUserOffline);
    };
  }, []);

  // SignalR mesajlarını dinle - gerçek zamanlı güncelleme
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('New message received via SignalR:', message);
      
      // Seçili talep için yeni mesaj geldi
      if (message.RequestId === selectedRequest?.id) {
        // Cevapları yeniden yükle
        loadRequestResponses(selectedRequest.id);
        
        // Support requests listesini de güncelle
        setSupportRequests(prev => 
          prev.map(req => 
            req.id === message.RequestId 
              ? { 
                  ...req, 
                  requestResponses: [...(req.requestResponses || []), {
                    id: Date.now(), // Geçici ID
                    message: message.Message,
                    senderId: message.UserId,
                    createdDate: message.Timestamp,
                    isRead: false
                  }]
                }
              : req
          )
        );
      }
    };

    const handleUserOnline = (data) => {
      console.log('User online event received in MessageManagement:', data);
      setOnlineUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    };

    const handleUserOffline = (data) => {
      console.log('User offline event received in MessageManagement:', data);
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    const handleOnlineUsers = (userIds) => {
      console.log('Online users updated in MessageManagement:', userIds);
      setOnlineUsers(userIds);
    };

    // SignalR service'ten mesaj dinleme
    signalrService.on('message:new', handleNewMessage);
    signalrService.on('user:online', handleUserOnline);
    signalrService.on('user:offline', handleUserOffline);
    signalrService.on('online:users', handleOnlineUsers);

    // Çevrimiçi kullanıcıları getir
    if (signalrService.isConnected) {
      signalrService.getOnlineUsers();
    }

    return () => {
      signalrService.off('message:new', handleNewMessage);
      signalrService.off('user:online', handleUserOnline);
      signalrService.off('user:offline', handleUserOffline);
      signalrService.off('online:users', handleOnlineUsers);
    };
  }, [selectedRequest, loadRequestResponses]);

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  // Durum rengi al
  const getStatusBadgeColor = (statusId) => {
    const statusColors = {
      1: 'bg-gray-100 text-gray-800 border-gray-200',    // Yeni
      2: 'bg-blue-100 text-blue-800 border-blue-200',   // İşlemde
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200', // Beklemede
      4: 'bg-green-100 text-green-800 border-green-200',  // Çözüldü
      5: 'bg-red-100 text-red-800 border-red-200'       // Kapalı
    };
    return statusColors[statusId] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Durum adı al
  const getStatusName = (statusId) => {
    const status = requestStatuses.find(s => s.id === statusId);
    return status?.name || 'Bilinmiyor';
  };

  // Talep türü adı al
  const getTypeName = (typeId) => {
    const type = requestTypes.find(t => t.id === typeId);
    return type?.name || 'Bilinmiyor';
  };

  // Filtrelenmiş talepler
  const filteredRequests = supportRequests.filter(request => {
    if (filters.search && !request.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.statusId && request.requestStatusId !== parseInt(filters.statusId)) {
      return false;
    }
    if (filters.typeId && request.requestTypeId !== parseInt(filters.typeId)) {
      return false;
    }
    return true;
  });

  // Talep seçildiğinde
  const handleRequestSelect = async (request) => {
    setSelectedRequest(request);
    await loadRequestResponses(request.id);
    setResponseForm({
      message: '',
      filePath: ''
    });
    
    // Tüm konuşmayı okundu işaretle
    try {
      await markConversationAsRead(request.id);
      
      // Mesajları yeniden yükle
      await loadRequestResponses(request.id);
      
      // Support requests listesini de güncelle
      setSupportRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { 
                ...req, 
                requestResponses: req.requestResponses?.map(r => 
                  r.senderId !== user?.id 
                    ? { ...r, isRead: true, readAt: new Date().toISOString() }
                    : r
                ) || []
              }
            : req
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [requestResponses]);

  // Cevap ekle
  const handleAddResponse = async () => {
    if (!responseForm.message.trim() || !selectedRequest) return;
    
    try {
      const responseData = {
        message: responseForm.message.trim(),
        filePath: responseForm.filePath || null,
        requestId: selectedRequest.id,
        isDeleted: false
      };
      
      // HTTP API ile veritabanına kaydet
      await createRequestResponse(responseData);
      
      // SignalR ile mesajı gönder (gerçek zamanlı güncelleme için)
      if (signalrService.isConnected) {
        try {
          await signalrService.sendMessageToGroup(`request_${selectedRequest.id}`, {
            RequestId: selectedRequest.id,
            Message: responseForm.message.trim(),
            UserId: user?.id,
            SenderName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.firstName || 'Destek',
            Timestamp: new Date().toISOString()
          });
          console.log('✅ Message sent via SignalR');
        } catch (signalrError) {
          console.error('❌ SignalR message send failed:', signalrError);
          // SignalR hatası olsa bile HTTP API başarılı olduğu için devam et
        }
      }
      
      setResponseForm({
        message: '',
        filePath: ''
      });
      
      // Cevapları yeniden yükle
      await loadRequestResponses(selectedRequest.id);
      
      toast.success('Cevap başarıyla eklendi.');
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Cevap eklenirken bir hata oluştu.');
    }
  };

  // Enter tuşu ile gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddResponse();
    }
  };

  // Mesaj tıklama - okundu işaretleme
  const handleMessageClick = async (response) => {
    if (!response.isRead && response.senderId !== user?.id) {
      try {
        await markAsRead(response.id);
        // Mesajları yeniden yükle
        await loadRequestResponses(selectedRequest.id);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  // Okunmamış mesaj sayısını hesapla
  const getUnreadCount = (request) => {
    if (!request.requestResponses) return 0;
    return request.requestResponses.filter(response => 
      !response.isRead && response.senderId !== user?.id
    ).length;
  };

  // Kullanıcının çevrimiçi olup olmadığını kontrol et
  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mesaj Yönetimi</h2>
        <p className="text-gray-600">Taleplere cevap verin ve mesajları yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] max-h-[calc(100vh-180px)]">
        {/* Sol Panel - Talep Listesi */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Atanan Talepler</h3>
              
              {/* Filtreler */}
              <div className="mt-4 space-y-3">
                <div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Talep ara..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <select
                    value={filters.statusId}
                    onChange={(e) => setFilters(prev => ({ ...prev, statusId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  <select
                    value={filters.typeId}
                    onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tüm Türler</option>
                    {requestTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[calc(100vh-400px)]">
              {filteredRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="py-8">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Atanan talep bulunmuyor</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestSelect(request)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                        selectedRequest?.id === request.id 
                          ? 'bg-indigo-50 border-l-indigo-500 border-r-4 border-r-indigo-500' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 mr-2">
                          {request.description}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${getStatusBadgeColor(request.requestStatusId)}`}>
                          {getStatusName(request.requestStatusId)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2 space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600">Tür:</span>
                          <span className="ml-1">{getTypeName(request.requestTypeId)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600">Oluşturan:</span>
                          <span className="ml-1">{request.requestCreator?.firstName} {request.requestCreator?.lastName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600">Tarih:</span>
                          <span className="ml-1">{formatDate(request.createdDate)}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {request.requestResponses && request.requestResponses.length > 0 && (
                          <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full inline-flex">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {request.requestResponses.length} cevap
                          </div>
                        )}
                        
                        {/* Okunmamış mesaj badge'i */}
                        {getUnreadCount(request) > 0 && (
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {getUnreadCount(request)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Panel - Mesaj Detayları ve Cevap Formu */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {selectedRequest ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Talep #{selectedRequest.id}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(selectedRequest.requestStatusId)}`}>
                          {getStatusName(selectedRequest.requestStatusId)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getTypeName(selectedRequest.requestTypeId)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(selectedRequest.createdDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-400px)]">
                  {/* Talep Açıklaması - İlk Mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {selectedRequest.requestCreator?.firstName?.charAt(0) || 'U'}
                            </div>
                            {/* Çevrimiçi durumu göstergesi */}
                            {isUserOnline(selectedRequest.requestCreator?.id) && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="ml-2">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {selectedRequest.requestCreator?.firstName} {selectedRequest.requestCreator?.lastName}
                              </p>
                              {isUserOnline(selectedRequest.requestCreator?.id) && (
                                <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(selectedRequest.createdDate)}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                        {selectedRequest.screenshotFilePath && (
                          <div className="mt-2">
                            <a 
                              href={selectedRequest.screenshotFilePath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-xs"
                            >
                              📎 Ekran Görüntüsü
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cevaplar */}
                  {requestResponses.map((response) => {
                    const isFromSupport = response.senderId !== selectedRequest.requestCreator?.id;
                    const isFromCurrentUser = response.senderId === user?.id;
                    
                    return (
                      <div key={response.id} className={`flex ${isFromSupport ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs lg:max-w-md">
                          <div 
                            className={`rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              isFromSupport 
                                ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                                : `bg-gray-100 text-gray-900 hover:bg-gray-200 ${!response.isRead ? 'ring-2 ring-blue-400 shadow-lg' : ''}`
                            }`}
                            onClick={() => handleMessageClick(response)}
                          >
                            <div className="flex items-center mb-2">
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isFromSupport ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'
                                }`}>
                                  {isFromSupport ? 'D' : (isFromCurrentUser ? 'S' : 'U')}
                                </div>
                                {/* Çevrimiçi durumu göstergesi */}
                                {!isFromSupport && isUserOnline(response.senderId) && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="ml-2">
                                <div className="flex items-center space-x-2">
                                  <p className={`text-sm font-medium ${isFromSupport ? 'text-white' : 'text-gray-900'}`}>
                                    {isFromSupport ? 'Destek' : (isFromCurrentUser ? 'Sen' : 'Kullanıcı')}
                                  </p>
                                  {!isFromSupport && isUserOnline(response.senderId) && (
                                    <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                                  )}
                                </div>
                                <p className={`text-xs ${isFromSupport ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {formatDate(response.createdDate)}
                                </p>
                              </div>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${isFromSupport ? 'text-white' : 'text-gray-700'}`}>
                              {response.message}
                            </p>
                            {response.filePath && (
                              <div className="mt-2">
                                <a 
                                  href={response.filePath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`text-xs hover:underline ${isFromSupport ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
                                >
                                  📎 Ek dosya
                                </a>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className={`text-xs ${isFromSupport ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {response.isRead ? '✓ Okundu' : '• Okunmadı'}
                              </div>
                              {response.readAt && (
                                <div className={`text-xs ${isFromSupport ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {formatDate(response.readAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Scroll to bottom ref */}
                  <div ref={setMessagesEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="space-y-3">
                    {/* Mesaj Input */}
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <textarea
                          value={responseForm.message}
                          onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                          onKeyPress={handleKeyPress}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                          placeholder="Cevabınızı yazın... (Enter ile gönder, Shift+Enter ile yeni satır)"
                        />
                      </div>
                      <button
                        onClick={handleAddResponse}
                        disabled={!responseForm.message.trim() || responseLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {responseLoading ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                    </div>

                    {/* Dosya Yolu Input */}
                    <div>
                      <input
                        type="text"
                        value={responseForm.filePath}
                        onChange={(e) => setResponseForm({...responseForm, filePath: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Dosya yolu (opsiyonel)..."
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg">Görüntülemek için bir talep seçin</p>
                  <p className="text-sm text-gray-400 mt-2">Sol panelden bir talep seçerek mesajlaşmaya başlayın</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageManagement;
