import React, { useState, useEffect } from 'react';
import signalrService from '../../services/signalrService';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';

const OnlineUsersList = ({ onUserSelect, selectedUserId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // SignalR event listeners
    const handleUserOnline = (data) => {
      console.log('User came online:', data.userId);
      setOnlineUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    };

    const handleUserOffline = (data) => {
      console.log('User went offline:', data.userId);
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    const handleOnlineUsers = (userIds) => {
      console.log('Online users updated:', userIds);
      setOnlineUsers(userIds);
    };

    // Event listeners'ı kaydet
    signalrService.on('user:online', handleUserOnline);
    signalrService.on('user:offline', handleUserOffline);
    signalrService.on('online:users', handleOnlineUsers);

    // Çevrimiçi kullanıcıları getir
    if (signalrService.isConnected) {
      signalrService.getOnlineUsers();
    }

    // Kullanıcı listesini yükle
    loadUsers();

    // Cleanup
    return () => {
      signalrService.off('user:online', handleUserOnline);
      signalrService.off('user:offline', handleUserOffline);
      signalrService.off('online:users', handleOnlineUsers);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOnlineUsers = () => {
    return users.filter(userData => onlineUsers.includes(userData.id));
  };

  const getOfflineUsers = () => {
    return users.filter(userData => !onlineUsers.includes(userData.id));
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Bilinmiyor';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const onlineUsersList = getOnlineUsers();
  const offlineUsersList = getOfflineUsers();

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Kullanıcılar</h3>
        <div className="flex items-center space-x-2 mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {onlineUsersList.length} çevrimiçi
          </span>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsersList.length > 0 && (
        <div className="p-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Çevrimiçi ({onlineUsersList.length})
          </h4>
          <div className="space-y-1">
            {onlineUsersList.map((userData) => (
              <div
                key={userData.id}
                onClick={() => onUserSelect && onUserSelect(userData)}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUserId === userData.id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData.firstName && userData.lastName 
                      ? `${userData.firstName} ${userData.lastName}` 
                      : userData.firstName || 'Bilinmeyen'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userData.email || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Users */}
      {offlineUsersList.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Çevrimdışı ({offlineUsersList.length})
          </h4>
          <div className="space-y-1">
            {offlineUsersList.slice(0, 10).map((userData) => (
              <div
                key={userData.id}
                onClick={() => onUserSelect && onUserSelect(userData)}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUserId === userData.id
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {userData.firstName && userData.lastName 
                      ? `${userData.firstName} ${userData.lastName}` 
                      : userData.firstName || 'Bilinmeyen'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userData.email || ''}
                  </p>
                </div>
              </div>
            ))}
            {offlineUsersList.length > 10 && (
              <p className="text-xs text-gray-400 text-center py-2">
                +{offlineUsersList.length - 10} daha fazla
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {onlineUsersList.length === 0 && offlineUsersList.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">Kullanıcı bulunamadı</p>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;
