import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useRequestResponses } from '../../hooks/useRequestResponses';
import signalrService from '../../services/signalrService';
import toast from 'react-hot-toast';
import { convertFileToBase64, validateFileType, validateFileSize, getFileIcon, formatFileSize } from '../../utils/fileUtils';
import Base64FileViewer from '../common/Base64FileViewer';

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
    selectedFile: null,
    fileBase64: null,
    fileName: null,
    fileMimeType: null
  });
  const [responseLoading, setResponseLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  // SignalR mesajlarını dinle - gerçek zamanlı güncelleme
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('New message received via SignalR in MessageCenter:', message);
      
      // Seçili talep için yeni mesaj geldi
      if (message.RequestId === selectedRequest?.id) {
        console.log(`✅ Message for selected request ${selectedRequest.id} received in MessageCenter`);
        // Cevapları yeniden yükle
        loadRequestResponses(selectedRequest.id);
        
        // User requests listesini de güncelle
        setUserRequests(prev => 
          prev.map(req => 
            req.id === message.RequestId 
              ? { 
                  ...req, 
                  requestResponses: [...(req.requestResponses || []), {
                    id: Date.now(), // Geçici ID
                    message: message.Message,
                    senderId: message.SenderId || message.UserId,
                    createdDate: message.CreatedDate || message.Timestamp,
                    isRead: false
                  }]
                }
              : req
          )
        );
      } else {
        console.log(`ℹ️ Message for different request (${message.RequestId}), current: ${selectedRequest?.id}`);
      }
    };

    // SignalR service'ten mesaj dinleme
    signalrService.on('message:new', handleNewMessage);

    return () => {
      signalrService.off('message:new', handleNewMessage);
    };
  }, [selectedRequest, loadRequestResponses]);


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
    
    // SignalR grubuna katıl
    if (signalrService.isConnected) {
      try {
        await signalrService.joinRoom(`Request_${request.id}`);
        console.log(`✅ Joined SignalR group: Request_${request.id}`);
      } catch (error) {
        console.error('❌ Failed to join SignalR group:', error);
      }
    }
    
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
        filePath: responseForm.filePath || null, // Backward compatibility
        fileBase64: responseForm.fileBase64,
        fileName: responseForm.fileName,
        fileMimeType: responseForm.fileMimeType,
        requestId: selectedRequest.id,
        senderId: user?.id,
        isDeleted: false
      };
      
      await createRequestResponse(responseData);
      
      // SignalR ile mesajı gönder (gerçek zamanlı güncelleme için)
      if (signalrService.isConnected) {
        try {
          await signalrService.sendMessageToGroup(`Request_${selectedRequest.id}`, {
            RequestId: selectedRequest.id,
            Message: responseForm.message.trim(),
            SenderId: user?.id,
            UserId: user?.id,
            SenderName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.firstName || 'Kullanıcı',
            CreatedDate: new Date().toISOString(),
            Timestamp: new Date().toISOString()
          });
          console.log('✅ Message sent via SignalR to group Request_' + selectedRequest.id);
        } catch (signalrError) {
          console.error('❌ SignalR message send failed:', signalrError);
          // SignalR hatası olsa bile HTTP API başarılı olduğu için devam et
        }
      } else {
        console.warn('⚠️ SignalR not connected, message will not be sent in real-time');
      }
      
      setResponseForm({
        message: '',
        filePath: '',
        selectedFile: null,
        fileBase64: null,
        fileName: null,
        fileMimeType: null
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
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya türü kontrolü
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'application/pdf', 'text/plain'
    ];
    if (!validateFileType(file, allowedTypes)) {
      toast.error('Desteklenmeyen dosya türü. Sadece resim, PDF ve metin dosyaları kabul edilir.');
      return;
    }

    // Dosya boyutu kontrolü (10MB)
    if (!validateFileSize(file, 10)) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    try {
      setIsUploading(true);
      toast.loading('Dosya yükleniyor...', { id: 'upload' });
      
      const fileData = await convertFileToBase64(file);
      setResponseForm(prev => ({
        ...prev,
        selectedFile: file,
        filePath: file.name, // Backward compatibility
        fileBase64: fileData.base64,
        fileName: fileData.fileName,
        fileMimeType: fileData.mimeType
      }));
      
      toast.success('Dosya başarıyla yüklendi!', { id: 'upload' });
    } catch (error) {
      console.error('Error converting file to base64:', error);
      toast.error('Dosya yüklenirken bir hata oluştu.', { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  // Dosya kaldırma
  const handleRemoveFile = () => {
    setResponseForm(prev => ({
      ...prev,
      selectedFile: null,
      filePath: '',
      fileBase64: null,
      fileName: null,
      fileMimeType: null
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Mesaj Merkezi
            </h2>
            <p className="text-gray-600 mt-1">Taleplerinize gelen cevapları ve mesajları görüntüleyin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]">
        {/* Sol Panel - Talep Listesi */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Taleplerim</h3>
              
              {/* Filtreler */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedTab === 'all'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSelectedTab('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedTab === 'unread'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  Cevaplı
                </button>
                <button
                  onClick={() => setSelectedTab('read')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    selectedTab === 'read'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  Cevapsız
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {selectedTab === 'all' ? 'Henüz talep oluşturmadınız' : 
                     selectedTab === 'unread' ? 'Cevaplı talep bulunmuyor' : 
                     'Cevapsız talep bulunmuyor'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestSelect(request)}
                      className={`group p-4 cursor-pointer rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        selectedRequest?.id === request.id 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg' 
                          : 'bg-white/60 hover:bg-white/80 border border-gray-200/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 mr-3">
                          {request.description}
                        </h4>
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusBadgeColor(request.requestStatusId)}`}>
                          {getStatusName(request.requestStatusId)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(request.createdDate)}
                        </div>
                        
                        {request.supportProvider && (
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="w-7 h-7 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {request.supportProvider.firstName?.charAt(0) || 'D'}
                              </div>
                              {isUserOnline(request.supportProvider.id) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-800">
                                  {request.supportProvider.firstName} {request.supportProvider.lastName}
                                </span>
                                {isUserOnline(request.supportProvider.id) && (
                                  <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                                    Çevrimiçi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {request.requestResponses && request.requestResponses.length > 0 && (
                          <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full font-medium">
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {request.requestResponses.length} cevap
                          </div>
                        )}
                        
                        {getUnreadCount(request) > 0 && (
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full flex flex-col overflow-hidden max-h-[calc(100vh-200px)]">
            {selectedRequest ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Talep #{selectedRequest.id}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusBadgeColor(selectedRequest.requestStatusId)}`}>
                            {getStatusName(selectedRequest.requestStatusId)}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(selectedRequest.createdDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0" style={{maxHeight: 'calc(100vh - 400px)'}}>
                  {/* Talep Açıklaması - İlk Mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-lg">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 shadow-lg border border-gray-200/50">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {user?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-bold text-gray-900">Siz</p>
                            <p className="text-xs text-gray-600 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(selectedRequest.createdDate)}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p>
                        {selectedRequest.screenshotFilePath && (
                          <div className="mt-3">
                            <a 
                              href={selectedRequest.screenshotFilePath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              Ekran Görüntüsü
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
                        <div className="max-w-lg">
                          <div 
                            className={`rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                              isFromCurrentUser 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                                : `bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 shadow-md ${!response.isRead ? 'ring-2 ring-blue-400 shadow-xl' : ''}`
                            }`}
                            onClick={() => handleMessageClick(response)}
                          >
                            <div className="flex items-center mb-3">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                                  isFromCurrentUser ? 'bg-indigo-600 text-white' : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                }`}>
                                  {isFromCurrentUser ? 'S' : 'D'}
                                </div>
                                {/* Çevrimiçi durumu göstergesi */}
                                {!isFromCurrentUser && isUserOnline(response.senderId) && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center space-x-2">
                                  <p className={`text-sm font-bold ${isFromCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                                    {isFromCurrentUser ? 'Sen' : 'Destek'}
                                  </p>
                                  {!isFromCurrentUser && isUserOnline(response.senderId) && (
                                    <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                                      Çevrimiçi
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs flex items-center ${isFromCurrentUser ? 'text-indigo-200' : 'text-gray-600'}`}>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(response.createdDate)}
                                </p>
                              </div>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isFromCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                              {response.message}
                            </p>
                            {(response.filePath || response.fileBase64) && (
                              <div className="mt-3">
                                {response.fileBase64 ? (
                                  <Base64FileViewer
                                    base64Data={response.fileBase64}
                                    fileName={response.fileName || response.filePath}
                                    mimeType={response.fileMimeType || 'application/octet-stream'}
                                    className="max-w-xs"
                                    showDownload={true}
                                  />
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (response.fileBase64) {
                                        // Base64 verisi varsa yeni sayfada aç
                                        const params = new URLSearchParams({
                                          data: response.fileBase64,
                                          name: response.fileName || response.filePath || 'Dosya',
                                          type: response.fileMimeType || 'application/octet-stream'
                                        });
                                        window.open(`/file-viewer?${params.toString()}`, '_blank');
                                      } else if (response.filePath) {
                                        // Eski filePath varsa direkt aç
                                        window.open(response.filePath, '_blank');
                                      }
                                    }}
                                    className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                      isFromCurrentUser 
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    }`}
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    Ek dosya
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div className={`text-xs font-medium ${isFromCurrentUser ? 'text-indigo-200' : 'text-gray-600'}`}>
                                {response.isRead ? (
                                  <span className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Okundu
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                    Okunmadı
                                  </span>
                                )}
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
                <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50 flex-shrink-0">
                  <div className="space-y-4">
                    {/* Mesaj Input */}
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={responseForm.message}
                          onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                          onKeyPress={handleKeyPress}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                          placeholder="Cevabınızı yazın... (Enter ile gönder, Shift+Enter ile yeni satır)"
                        />
                      </div>
                      <button
                        onClick={handleSendResponse}
                        disabled={!responseForm.message.trim() || responseLoading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                      >
                        {responseLoading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Gönderiliyor...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Gönder
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Dosya Seçme */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center px-4 py-2 border border-gray-300/50 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md ${
                          isUploading 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer hover:bg-white/80'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {isUploading ? 'Yükleniyor...' : 'Dosya Seç'}
                      </label>
                      
                      {responseForm.selectedFile && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-xl border border-indigo-200/50 shadow-sm">
                            <span className="text-indigo-600 text-lg">{getFileIcon(responseForm.fileMimeType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-indigo-900 truncate">
                                {responseForm.fileName}
                              </p>
                              <p className="text-xs text-indigo-600">
                                {formatFileSize(responseForm.selectedFile.size)} • {responseForm.fileMimeType}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Görüntülemek için bir talep seçin</h3>
                  <p className="text-gray-500">Sol panelden bir talep seçerek mesajlaşmaya başlayın</p>
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
