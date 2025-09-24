import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useRequestResponses } from '../../hooks/useRequestResponses';
import { useSocket } from '../../hooks/useSocket';
import signalrService from '../../services/signalrService';
import toast from 'react-hot-toast';
import { convertFileToBase64, validateFileType, validateFileSize, getFileIcon, formatFileSize } from '../../utils/fileUtils';
import Base64FileViewer from '../common/Base64FileViewer';
import ErrorBoundary from '../common/ErrorBoundary';
import api from '../../services/api';

const MessageManagement = ({ selectedRequestId, onRequestSelected }) => {
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
    filePath: '',
    selectedFile: null,
    fileBase64: null,
    fileName: null,
    fileMimeType: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [messagesEndRef, setMessagesEndRef] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [screenshotData, setScreenshotData] = useState(null);
  const [sendingMessages, setSendingMessages] = useState(new Set());

  // Support kullanıcısının taleplerini yükle
  const loadSupportRequests = useCallback(async () => {
    if (!user?.id) {
      // Console log removed
      return;
    }
    
    // Console log removed
    
    try {
      setLoading(true);
      // Console log removed
      const supportRequests = await fetchRequests({
        supportProviderId: user?.id,
        pageSize: 100
      });
      // Console log removed
      // Console log removed
      
      // API'den gelen veriyi direkt kullan
      if (supportRequests && supportRequests.length > 0) {
        // Console log removed
        setSupportRequests(supportRequests);
      } else {
        // Console log removed
        setSupportRequests([]);
      }
    } catch (error) {
      // Console log removed
      // Console log removed
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
      
      
      // API'den gelen veriyi düzelt - "null" string'leri gerçek null'a çevir
      const cleanedResponses = responses?.map(response => {
        const cleaned = {
          ...response,
          // Backend'den gelen field'ları frontend'deki field'lara map et
          base64Data: response.fileBase64 === 'null' || response.fileBase64 === 'undefined' ? null : response.fileBase64,
          filePath: response.filePath === 'null' || response.filePath === 'undefined' ? null : response.filePath,
          fileName: response.fileName === 'null' || response.fileName === 'undefined' ? null : response.fileName,
          mimeType: response.fileMimeType === 'null' || response.fileMimeType === 'undefined' ? null : response.fileMimeType,
          // Eski field'ları da koru (geriye uyumluluk için)
          fileBase64: response.fileBase64 === 'null' || response.fileBase64 === 'undefined' ? null : response.fileBase64,
          fileMimeType: response.fileMimeType === 'null' || response.fileMimeType === 'undefined' ? null : response.fileMimeType
        };
        
        
        return cleaned;
      }) || [];
      
      setRequestResponses(cleanedResponses);
      
      // Tüm konuşmayı okundu olarak işaretle (daha verimli)
      try {
        await markConversationAsRead(requestId);
      } catch (error) {
        // Console log removed
      }
    } catch (error) {
      // Console log removed
      toast.error('Cevaplar yüklenirken bir hata oluştu.');
    }
  }, [getRequestResponsesByRequestId, markConversationAsRead]);

  // Screenshot verisini yükle
  const loadScreenshotData = useCallback(async (request) => {
    if (!request.screenshotFilePath) {
      setScreenshotData(null);
      return;
    }

    try {
      // API endpoint'ini kullanarak screenshot'ı çek
      const response = await api.get(`/File/request/${request.id}/screenshot`);
      
      setScreenshotData({
        base64Data: response.data.base64Data || response.data.fileBase64,
        fileName: response.data.fileName || request.screenshotFilePath.split('/').pop(),
        mimeType: response.data.mimeType || response.data.fileMimeType || 'image/jpeg'
      });
    } catch (error) {
      // Fallback: filePath'i direkt kullan
      setScreenshotData({
        filePath: request.screenshotFilePath,
        fileName: request.screenshotFilePath.split('/').pop(),
        mimeType: 'image/jpeg'
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadSupportRequests();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadSupportRequests]);

  // Prop'tan gelen requestId'yi kullan ve ilgili talebi seç
  useEffect(() => {
    // Console log removed
    // Console log removed
    // Console log removed
    
    if (selectedRequestId && supportRequests.length > 0 && (!selectedRequest || selectedRequest.id !== selectedRequestId)) {
      const request = supportRequests.find(req => req.id === selectedRequestId);
      // Console log removed
      
      if (request) {
        // Console log removed
        handleRequestSelect(request);
        // Prop'u temizle
        if (onRequestSelected) {
          onRequestSelected(null);
        }
      }
    }
  }, [selectedRequestId, supportRequests, selectedRequest, onRequestSelected]);

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
      // Console log removed
      
      // Seçili talep için yeni mesaj geldi
      if (message.RequestId === selectedRequest?.id) {
        // Console log removed
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
                    senderId: message.SenderId || message.UserId,
                    createdDate: message.CreatedDate || message.Timestamp,
                    isRead: false
                  }]
                }
              : req
          )
        );
      } else {
        // Console log removed, current: ${selectedRequest?.id}`);
      }
    };

    const handleUserOnline = (data) => {
      // Console log removed
      setOnlineUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    };

    const handleUserOffline = (data) => {
      // Console log removed
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    const handleOnlineUsers = (userIds) => {
      // Console log removed
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

  // Saat formatla (mesajlar için)
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  // Tarih formatla (gün ayırıcı için)
  const formatDateForDivider = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Mesajları günlere göre grupla
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdDate);
      const messageDateString = messageDate.toDateString();
      
      if (currentDate !== messageDateString) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDateString;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
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
    
    // Screenshot verisini yükle
    await loadScreenshotData(request);
    
    setResponseForm({
      message: '',
      filePath: '',
      selectedFile: null,
      fileBase64: null,
      fileName: null,
      fileMimeType: null
    });
    
    // Prop'u temizle (diğer chatlere geçebilmek için)
    if (onRequestSelected) {
      onRequestSelected(null);
      // Console log removed
    }
    
    // SignalR grubuna katıl
    if (signalrService.isConnected) {
      try {
        await signalrService.joinRoom(`Request_${request.id}`);
        // Console log removed
      } catch (error) {
        // Console log removed
      }
    }
    
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
      // Console log removed
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [requestResponses]);

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
      // Console log removed
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

  // Cevap ekle
  const handleAddResponse = async () => {
    if (!responseForm.message.trim() || !selectedRequest) return;
    
    try {
      const responseData = {
        message: responseForm.message.trim(),
        filePath: responseForm.filePath || null, // Backward compatibility
        fileBase64: responseForm.fileBase64,
        fileName: responseForm.fileName,
        fileMimeType: responseForm.fileMimeType,
        requestId: selectedRequest.id,
        isDeleted: false
      };
      
      // HTTP API ile veritabanına kaydet
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
              : user?.firstName || 'Destek',
            CreatedDate: new Date().toISOString(),
            Timestamp: new Date().toISOString()
          });
          // Console log removed
        } catch (signalrError) {
          // Console log removed
          // SignalR hatası olsa bile HTTP API başarılı olduğu için devam et
        }
      } else {
        // Console log removed
      }
      
      setResponseForm({
        message: '',
        filePath: '',
        selectedFile: null,
        fileBase64: null,
        fileName: null,
        fileMimeType: null
      });
      
      // Cevapları yeniden yükle
      await loadRequestResponses(selectedRequest.id);
      
      toast.success('Cevap başarıyla eklendi.');
    } catch (error) {
      // Console log removed
      toast.error('Cevap eklenirken bir hata oluştu.');
    }
  };

  // Mesaj parametresi ile cevap ekleme (Enter tuşu için)
  const handleAddResponseWithMessage = async (messageToSend) => {
    if (!messageToSend || !selectedRequest) return;
    
    const messageId = Date.now().toString();
    setSendingMessages(prev => new Set([...prev, messageId]));
    
    try {
      const responseData = {
        message: messageToSend,
        filePath: responseForm.filePath || null, // Backward compatibility
        fileBase64: responseForm.fileBase64,
        fileName: responseForm.fileName,
        fileMimeType: responseForm.fileMimeType,
        requestId: selectedRequest.id,
        isDeleted: false
      };
      
      // HTTP API ile veritabanına kaydet
      await createRequestResponse(responseData);
      
      // SignalR ile mesajı gönder (gerçek zamanlı güncelleme için)
      if (signalrService.isConnected) {
        try {
          await signalrService.sendMessageToGroup(`Request_${selectedRequest.id}`, {
            RequestId: selectedRequest.id,
            Message: messageToSend,
            SenderId: user?.id,
            UserId: user?.id,
            SenderName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.firstName || 'Destek',
            CreatedDate: new Date().toISOString(),
            Timestamp: new Date().toISOString()
          });
          // Console log removed
        } catch (signalrError) {
          // Console log removed
          // SignalR hatası olsa bile HTTP API başarılı olduğu için devam et
        }
      } else {
        // Console log removed
      }
      
      // Cevapları yeniden yükle
      await loadRequestResponses(selectedRequest.id);
      
      toast.success('Cevap başarıyla eklendi.');
    } catch (error) {
      // Console log removed
      toast.error('Cevap eklenirken bir hata oluştu.');
    } finally {
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  // Enter tuşu ile gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Mesajı hemen temizle
      const messageToSend = responseForm.message.trim();
      if (messageToSend && selectedRequest) {
        setResponseForm({
          message: '',
          filePath: '',
          selectedFile: null,
          fileBase64: null,
          fileName: null,
          fileMimeType: null
        });
        // Mesajı gönder
        handleAddResponseWithMessage(messageToSend);
      }
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
        // Console log removed
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Mesaj Yönetimi
            </h2>
            <p className="text-gray-600 mt-1">Taleplere cevap verin ve mesajları yönetin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]">
        {/* Sol Panel - Talep Listesi */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Atanan Talepler</h3>
              
              {/* Filtreler */}
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Talep ara..."
                    className="w-full px-4 py-2 text-sm border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                  />
                </div>
                
                <div>
                  <select
                    value={filters.statusId}
                    onChange={(e) => setFilters(prev => ({ ...prev, statusId: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
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
                    className="w-full px-4 py-2 text-sm border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
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

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{height: 'calc(100vh - 455px)'}}>
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Atanan talep bulunmuyor</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {getTypeName(request.requestTypeId)}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {request.requestCreator?.firstName} {request.requestCreator?.lastName}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(request.createdDate)}
                        </div>
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

        {/* Sağ Panel - Mesaj Detayları ve Cevap Formu */}
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
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">Talep #{selectedRequest.id}</h3>
                        </div>
                        {isUserOnline(selectedRequest.requestCreator?.id) && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-sm text-gray-600 font-medium">
                              {selectedRequest.requestCreator?.firstName} {selectedRequest.requestCreator?.lastName}
                            </span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600 font-medium">çevrimiçi</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusBadgeColor(selectedRequest.requestStatusId)}`}>
                            {getStatusName(selectedRequest.requestStatusId)}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {getTypeName(selectedRequest.requestTypeId)}
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
                <div className="overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-[#0a0a0a]" style={{height: 'calc(100vh - 400px)'}}>
                  {/* Talep Açıklaması - İlk Mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-[70%]">
                      <div className="bg-[#2a2f32] rounded-lg p-1.5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-[#e9edef]">
                            {selectedRequest.requestCreator?.firstName} {selectedRequest.requestCreator?.lastName}
                          </p>
                          <p className="text-xs text-[#8696a0]">
                            {formatTime(selectedRequest.createdDate)}
                          </p>
                        </div>
                        <p className="text-[#e9edef] text-sm whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p>
                        {screenshotData && (
                          <div className="mt-2">
                            <Base64FileViewer
                              base64Data={screenshotData.base64Data}
                              filePath={screenshotData.filePath}
                              fileName={screenshotData.fileName}
                              mimeType={screenshotData.mimeType}
                              className="max-w-sm"
                              showDownload={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cevaplar - Günlere göre gruplandırılmış */}
                  {groupMessagesByDate(requestResponses).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Gün ayırıcı */}
                      <div className="flex justify-center my-4">
                        <div className="bg-[#2a2f32] text-[#8696a0] px-3 py-1 rounded-full text-xs font-medium">
                          {formatDateForDivider(group.messages[0].createdDate)}
                        </div>
                      </div>
                      
                      {/* Günün mesajları */}
                      {group.messages.map((response) => {
                        const isFromCurrentUser = response.senderId === user?.id;
                        const isFromSupport = !isFromCurrentUser && response.senderId !== selectedRequest.requestCreator?.id;
                        
                        
                        return (
                          <div key={response.id} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className="max-w-[70%]">
                              <div 
                                className={`rounded-lg p-1.5 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                  isFromCurrentUser 
                                    ? 'bg-[#005c4b] text-white' 
                                    : `bg-[#2a2f32] text-[#e9edef] ${!response.isRead ? 'ring-1 ring-blue-400' : ''}`
                                }`}
                                onClick={() => handleMessageClick(response)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-1">
                                    <p className={`text-xs font-medium ${isFromCurrentUser ? 'text-white' : 'text-[#e9edef]'}`}>
                                      {(() => {
                                        if (isFromCurrentUser) {
                                          return 'Sen';
                                        }
                                        
                        // Sender name logic - use sender object from API response
                        const senderName = response.senderName;
                        const senderFirstName = response.sender?.firstName;
                        const senderLastName = response.sender?.lastName;
                        const requestCreatorFirstName = selectedRequest.requestCreator?.firstName;
                        const requestCreatorLastName = selectedRequest.requestCreator?.lastName;
                        
                        // Use sender object from API response (lowercase 's')
                        return senderName || (response.sender ? `${senderFirstName} ${senderLastName}` : `${requestCreatorFirstName} ${requestCreatorLastName}`);
                                      })()}
                                    </p>
                                    <p className={`text-xs ${isFromCurrentUser ? 'text-green-100' : 'text-[#8696a0]'}`}>
                                      {formatTime(response.createdDate)}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {response.isRead ? (
                                      <div className="flex items-center">
                                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                        <svg className="w-3 h-3 -ml-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isFromCurrentUser ? 'text-white' : 'text-[#e9edef]'}`}>
                                    {response.message}
                                  </p>
                                  {sendingMessages.has(response.id?.toString()) && (
                                    <div className="flex items-center">
                                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                {(response.filePath || response.fileBase64) && (
                                  <div className="mt-1">
                                    <ErrorBoundary>
                                      <Base64FileViewer
                                        base64Data={response.fileBase64}
                                        filePath={response.filePath}
                                        fileName={response.fileName || response.filePath}
                                        mimeType={response.fileMimeType || 'application/octet-stream'}
                                        className="max-w-sm"
                                        showDownload={true}
                                      />
                                    </ErrorBoundary>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Scroll to bottom ref */}
                  <div ref={setMessagesEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-[#2a2f32] bg-[#1e2428] flex-shrink-0">
                  <div className="space-y-3">
                    {/* Mesaj Input */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <textarea
                          value={responseForm.message}
                          onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                          onKeyPress={handleKeyPress}
                          rows={2}
                          className="w-full px-4 py-3 border border-[#2a2f32] rounded-full focus:outline-none focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884] resize-none text-sm bg-[#2a2f32] text-[#e9edef] placeholder-[#8696a0] transition-all duration-200"
                          placeholder="Mesaj yazın..."
                        />
                      </div>
                      
                      {/* Dosya Seçme Butonu */}
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,application/pdf,text/*"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center w-12 h-12 border border-[#2a2f32] rounded-full text-sm font-medium bg-[#2a2f32] text-[#e9edef] transition-all duration-200 hover:bg-[#3b4043] ${
                          isUploading 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer'
                        }`}
                      >
                        <svg className="w-5 h-5 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </label>
                      
                      {/* Gönderme Butonu */}
                      <button
                        onClick={handleAddResponse}
                        disabled={!responseForm.message.trim()}
                        className="w-12 h-12 bg-[#00a884] text-white rounded-full hover:bg-[#008069] focus:outline-none focus:ring-2 focus:ring-[#00a884] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 disabled:transform-none flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>

                    {/* Seçilen Dosya Gösterimi */}
                    {responseForm.selectedFile && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-3 bg-[#2a2f32] px-3 py-2 rounded-lg border border-[#3b4043]">
                          <span className="text-[#00a884] text-lg">{getFileIcon(responseForm.fileMimeType)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#e9edef] truncate">
                              {responseForm.fileName}
                            </p>
                            <p className="text-xs text-[#8696a0]">
                              {formatFileSize(responseForm.selectedFile.size)} • {responseForm.fileMimeType}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-[#8696a0] hover:text-[#e9edef] transition-colors p-1 rounded hover:bg-[#3b4043]"
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

export default MessageManagement;
