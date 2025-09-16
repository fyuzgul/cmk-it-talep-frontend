import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useRequestResponses } from '../../hooks/useRequestResponses';
import signalrService from '../../services/signalrService';
import toast from 'react-hot-toast';

const MessageCenter = () => {
  console.log('🚀 MessageCenter component rendered');
  
  const { user } = useAuth();
  console.log('🚀 MessageCenter - user from useAuth:', user);
  
  const { getRequestsByCreator } = useRequests();
  const { getRequestResponsesByRequestId, createRequestResponse, markAsRead } = useRequestResponses();
  
  const [userRequests, setUserRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestResponses, setRequestResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // all, unread, read
  const [responseForm, setResponseForm] = useState({
    message: '',
    filePath: '',
    selectedFile: null
  });
  const [responseLoading, setResponseLoading] = useState(false);
  const [messagesEndRef, setMessagesEndRef] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Kullanıcının taleplerini yükle
  const loadUserRequests = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user.id found, skipping request loading');
      return;
    }
    
    console.log('🔄 Loading user requests for user.id:', user.id);
    console.log('🔄 Current userRequests state:', userRequests);
    
    try {
      setLoading(true);
      console.log('📡 Calling getRequestsByCreator API...');
      const requests = await getRequestsByCreator(user.id);
      console.log('✅ API Response - Loaded user requests:', requests);
      console.log('📊 Request count:', requests?.length || 0);
      console.log('📊 Request details:', requests?.map(r => ({ id: r.id, description: r.description })));
      
      // API'den gelen veriyi direkt kullan
      if (requests && requests.length > 0) {
        console.log('✅ Using API response directly');
        setUserRequests(requests);
        console.log('✅ userRequests state updated');
      } else {
        console.log('⚠️ No requests found in API response');
        setUserRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading user requests:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error stack:', error.stack);
      toast.error('Talepler yüklenirken bir hata oluştu.');
      setUserRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getRequestsByCreator]);

  // Seçili talebin cevaplarını yükle
  const loadRequestResponses = useCallback(async (requestId) => {
    try {
      const responses = await getRequestResponsesByRequestId(requestId);
      setRequestResponses(responses || []);
    } catch (error) {
      console.error('Error loading request responses:', error);
      toast.error('Cevaplar yüklenirken bir hata oluştu.');
    }
  }, [getRequestResponsesByRequestId]);

  useEffect(() => {
    console.log('🔄 MessageCenter useEffect triggered');
    console.log('🔄 user?.id:', user?.id);
    console.log('🔄 user object:', user);
    
    if (user?.id) {
      console.log('🔄 Calling loadUserRequests...');
      loadUserRequests();
    } else {
      console.log('🔄 No user.id, setting loading to false');
      setLoading(false);
    }
  }, [user?.id, loadUserRequests]);

  // Çevrimiçi kullanıcıları takip et - global state kullan
  useEffect(() => {
    // Global online users state'ini al
    setOnlineUsers(signalrService.getOnlineUsersList());
    
    // SignalR bağlantısı kontrolü
    if (signalrService.isConnected) {
      console.log('🔵 MessageCenter - SignalR connected, waiting for online users...');
    } else {
      console.log('❌ MessageCenter - SignalR not connected');
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


  // Kullanıcının çevrimiçi olup olmadığını kontrol et
  const isUserOnline = (userId) => {
    const isOnline = onlineUsers.includes(userId);
    console.log(`🔍 MessageCenter - isUserOnline(${userId}): ${isOnline}, onlineUsers:`, onlineUsers);
    return isOnline;
  };

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
    const statusNames = {
      1: 'Yeni',
      2: 'İşlemde',
      3: 'Beklemede',
      4: 'Çözüldü',
      5: 'Kapalı'
    };
    return statusNames[statusId] || 'Bilinmiyor';
  };

  // Filtrelenmiş talepler
  const filteredRequests = userRequests.filter(request => {
    if (selectedTab === 'unread') {
      // Cevapları olan talepler (okunmamış sayılır)
      return request.requestResponses && request.requestResponses.length > 0;
    } else if (selectedTab === 'read') {
      // Cevapları olmayan talepler (okunmuş sayılır)
      return !request.requestResponses || request.requestResponses.length === 0;
    }
    return true; // all
  });

  // Talep seçildiğinde
  const handleRequestSelect = async (request) => {
    setSelectedRequest(request);
    await loadRequestResponses(request.id);
    
    // Tüm konuşmayı okundu işaretle
    try {
      await markConversationAsRead(request.id);
      
      // Mesajları yeniden yükle
      await loadRequestResponses(request.id);
      
      // User requests listesini de güncelle
      setUserRequests(prev => 
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

  // Cevap gönderme
  const handleSendResponse = async () => {
    if (!responseForm.message.trim() || !selectedRequest) return;
    
    try {
      setResponseLoading(true);
      const responseData = {
        message: responseForm.message.trim(),
        filePath: responseForm.filePath || null,
        requestId: selectedRequest.id,
        senderId: user?.id,
        isDeleted: false
      };
      
      await createRequestResponse(responseData);
      setResponseForm({
        message: '',
        filePath: '',
        selectedFile: null
      });
      
      // Reload responses
      await loadRequestResponses(selectedRequest.id);
      
      toast.success('Cevabınız başarıyla gönderildi.');
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Cevap gönderilirken bir hata oluştu.');
    } finally {
      setResponseLoading(false);
    }
  };

  // Enter tuşu ile gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  // Dosya seçme
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResponseForm(prev => ({
        ...prev,
        selectedFile: file,
        filePath: file.name
      }));
    }
  };

  // Dosya kaldırma
  const handleRemoveFile = () => {
    setResponseForm(prev => ({
      ...prev,
      selectedFile: null,
      filePath: ''
    }));
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mesaj Merkezi</h2>
        <p className="text-gray-600">Taleplerinize gelen cevapları ve mesajları görüntüleyin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sol Panel - Talep Listesi */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Taleplerim</h3>
              
              {/* Filtreler */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedTab === 'all'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSelectedTab('unread')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedTab === 'unread'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cevaplı
                </button>
                <button
                  onClick={() => setSelectedTab('read')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedTab === 'read'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cevapsız
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {selectedTab === 'all' ? 'Henüz talep oluşturmadınız' : 
                   selectedTab === 'unread' ? 'Cevaplı talep bulunmuyor' : 
                   'Cevapsız talep bulunmuyor'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestSelect(request)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRequest?.id === request.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {request.description}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(request.requestStatusId)}`}>
                          {getStatusName(request.requestStatusId)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <div>Oluşturulma: {formatDate(request.createdDate)}</div>
                        {request.modifiedDate && (
                          <div>Son Güncelleme: {formatDate(request.modifiedDate)}</div>
                        )}
                        {request.supportProvider && (
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="relative">
                              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {request.supportProvider.firstName?.charAt(0) || 'D'}
                              </div>
                              {/* Çevrimiçi durumu göstergesi */}
                              {isUserOnline(request.supportProvider.id) && (
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
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
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {request.requestResponses && request.requestResponses.length > 0 && (
                          <div className="flex items-center text-xs text-indigo-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Sağ Panel - Chat Benzeri Mesaj Paneli */}
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
                          {formatDate(selectedRequest.createdDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Talep Açıklaması - İlk Mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-medium text-gray-900">Siz</p>
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
                    // String ve number karşılaştırması için güvenli kontrol
                    const isFromCurrentUser = String(response.senderId) === String(user?.id);
                    
                    console.log('🔍 MessageCenter - Response debug:', {
                      responseId: response.id,
                      senderId: response.senderId,
                      isFromCurrentUser,
                      user: user?.id,
                      isOnline: !isFromCurrentUser ? isUserOnline(response.senderId) : false
                    });
                    
                    return (
                      <div key={response.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs lg:max-w-md">
                          <div 
                            className={`rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              isFromCurrentUser 
                                ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                                : `bg-gray-100 text-gray-900 hover:bg-gray-200 ${!response.isRead ? 'ring-2 ring-blue-400 shadow-lg' : ''}`
                            }`}
                            onClick={() => handleMessageClick(response)}
                          >
                            <div className="flex items-center mb-2">
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isFromCurrentUser ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'
                                }`}>
                                  {isFromCurrentUser ? 'S' : 'D'}
                                </div>
                                {/* Çevrimiçi durumu göstergesi */}
                                {!isFromCurrentUser && isUserOnline(response.senderId) && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="ml-2">
                                <div className="flex items-center space-x-2">
                                  <p className={`text-sm font-medium ${isFromCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                                    {isFromCurrentUser ? 'Sen' : 'Destek'}
                                  </p>
                                  {!isFromCurrentUser && isUserOnline(response.senderId) && (
                                    <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
                                  )}
                                </div>
                                <p className={`text-xs ${isFromCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {formatDate(response.createdDate)}
                                </p>
                              </div>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${isFromCurrentUser ? 'text-white' : 'text-gray-700'}`}>
                              {response.message}
                            </p>
                            {response.filePath && (
                              <div className="mt-2">
                                <a 
                                  href={response.filePath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`text-xs hover:underline ${isFromCurrentUser ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
                                >
                                  📎 Ek dosya
                                </a>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className={`text-xs ${isFromCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                                {response.isRead ? '✓ Okundu' : '• Okunmadı'}
                              </div>
                              {response.readAt && (
                                <div className={`text-xs ${isFromCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}>
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
                <div className="p-4 border-t border-gray-200 bg-gray-50">
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
                        onClick={handleSendResponse}
                        disabled={!responseForm.message.trim() || responseLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {responseLoading ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                    </div>

                    {/* Dosya Seçme */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Dosya Seç
                      </label>
                      
                      {responseForm.selectedFile && (
                        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md">
                          <span className="text-sm text-gray-700 truncate max-w-xs">
                            {responseForm.selectedFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
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

export default MessageCenter;
