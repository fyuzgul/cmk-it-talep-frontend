import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import signalrService from '../../services/signalrService';
import ChatWindow from './ChatWindow';
import OnlineUsersList from './OnlineUsersList';
import requestService from '../../services/requestService';

const ChatPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
    
    // SignalR bağlantısını kontrol et ve bağlan
    if (!signalrService.isConnected && user?.token) {
      signalrService.connect(user.token).catch(console.error);
    }
  }, [user?.token]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestService.getAllRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSelect = (request) => {
    setSelectedRequest(request);
    setShowChat(true);
  };

  const handleUserSelect = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedRequest(null);
    setSelectedUser(null);
  };

  const getRequestStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Mesajlaşma</h1>
          <p className="text-sm text-gray-600">Talepler ve kullanıcılarla iletişim kurun</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedUser(null)}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              !selectedUser ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            Talepler
          </button>
          <button
            onClick={() => setSelectedRequest(null)}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              selectedUser ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            Kullanıcılar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedUser ? (
            // Requests List
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Aktif Talepler</h3>
              {requests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Henüz talep bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestSelect(request)}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Talep #{request.id}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRequestStatusColor(
                            request.requestStatus?.name
                          )}`}
                        >
                          {request.requestStatus?.name || 'Bilinmiyor'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {request.description?.substring(0, 100)}
                        {request.description?.length > 100 && '...'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{request.user?.firstName && request.user?.lastName 
                          ? `${request.user.firstName} ${request.user.lastName}` 
                          : request.user?.firstName || 'Bilinmeyen'}</span>
                        <span>{formatDate(request.createdDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Users List
            <div className="p-4">
              <OnlineUsersList
                onUserSelect={handleUserSelect}
                selectedUserId={selectedUser?.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showChat ? (
          <div className="flex-1 p-4">
            <ChatWindow
              requestId={selectedRequest?.id}
              userId={selectedUser?.id}
              onClose={handleCloseChat}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mesajlaşmaya Başlayın
              </h3>
              <p className="text-gray-600">
                Sol taraftan bir talep veya kullanıcı seçerek mesajlaşmaya başlayabilirsiniz.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
