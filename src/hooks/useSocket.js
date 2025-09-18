import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';

export const useSocket = () => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  
  const listenersRef = useRef(new Map());

  // Socket bağlantısını başlat
  const connect = useCallback(() => {
    if (token && user?.id) {
      // Console log removed + '...' });
      socketService.connect(token);
    }
  }, [token, user?.id]);

  // Socket bağlantısını kapat
  const disconnect = useCallback(() => {
    // Console log removed
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(null);
    setOnlineUsers([]);
  }, []);

  // Event dinleyici ekle
  const addListener = useCallback((event, callback) => {
    socketService.on(event, callback);
    
    // Cleanup için referansı sakla
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    listenersRef.current.get(event).push(callback);
  }, []);

  // Event dinleyici kaldır
  const removeListener = useCallback((event, callback) => {
    socketService.off(event, callback);
    
    if (listenersRef.current.has(event)) {
      const callbacks = listenersRef.current.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }, []);

  // Socket'e mesaj gönder
  const send = useCallback((event, data) => {
    socketService.send(event, data);
  }, []);

  // Kullanıcıyı çevrimiçi yap
  const setUserOnline = useCallback((userId) => {
    socketService.setUserOnline(userId);
  }, []);

  // Kullanıcıyı çevrimdışı yap
  const setUserOffline = useCallback((userId) => {
    socketService.setUserOffline(userId);
  }, []);

  // Son görülme zamanını güncelle
  const updateLastSeen = useCallback(() => {
    socketService.updateLastSeen();
  }, []);

  // Çevrimiçi kullanıcıları iste
  const requestOnlineUsers = useCallback(() => {
    socketService.requestOnlineUsers();
  }, []);

  // Mesaj gönder
  const sendMessage = useCallback((messageData) => {
    socketService.sendMessage(messageData);
  }, []);

  // Mesajı okundu işaretle
  const markMessageAsRead = useCallback((messageId) => {
    socketService.markMessageAsRead(messageId);
  }, []);

  // Component mount olduğunda bağlan
  useEffect(() => {
    if (user && token) {
      connect();
    }

    // Cleanup function
    return () => {
      // Tüm dinleyicileri temizle
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socketService.off(event, callback);
        });
      });
      listenersRef.current.clear();
    };
  }, [user, token, connect]);

  // Socket event dinleyicileri
  useEffect(() => {
    const handleConnect = (data) => {
      // Console log removed
      setIsConnected(true);
      setSocketId(data.socketId);
      setConnectionError(null);
    };

    const handleDisconnect = (data) => {
      // Console log removed
      setIsConnected(false);
      setSocketId(null);
    };

    const handleError = (data) => {
      // Console log removed
      setConnectionError(data.error);
    };

    const handleOnlineUsers = (users) => {
      // Console log removed
      setOnlineUsers(users);
    };

    const handleUserStatusChanged = (data) => {
      // Console log removed
      setOnlineUsers(prev => {
        if (data.isOnline) {
          // Kullanıcı çevrimiçi oldu - ekle veya güncelle
          const exists = prev.some(user => user.userId === data.userId);
          if (!exists) {
            return [...prev, data];
          } else {
            return prev.map(user => 
              user.userId === data.userId 
                ? { ...user, isOnline: true, lastSeen: data.lastSeen }
                : user
            );
          }
        } else {
          // Kullanıcı çevrimdışı oldu - kaldır
          return prev.filter(user => user.userId !== data.userId);
        }
      });
    };

    const handleUserOnline = (data) => {
      // Console log removed
      setOnlineUsers(prev => {
        const exists = prev.some(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleUserOffline = (data) => {
      // Console log removed
      setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
    };

    // Event dinleyicilerini ekle
    addListener('socket:connected', handleConnect);
    addListener('socket:disconnected', handleDisconnect);
    addListener('socket:error', handleError);
    addListener('online:users', handleOnlineUsers);
    addListener('user:status-changed', handleUserStatusChanged);
    addListener('user:online', handleUserOnline);
    addListener('user:offline', handleUserOffline);

    // Cleanup
    return () => {
      removeListener('socket:connected', handleConnect);
      removeListener('socket:disconnected', handleDisconnect);
      removeListener('socket:error', handleError);
      removeListener('online:users', handleOnlineUsers);
      removeListener('user:status-changed', handleUserStatusChanged);
      removeListener('user:online', handleUserOnline);
      removeListener('user:offline', handleUserOffline);
    };
  }, [addListener, removeListener]);

  // Otomatik son görülme güncelleme
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        updateLastSeen();
      }, 30000); // Her 30 saniyede bir

      return () => clearInterval(interval);
    }
  }, [isConnected, updateLastSeen]);

  return {
    // Bağlantı durumu
    isConnected,
    socketId,
    connectionError,
    
    // Çevrimiçi kullanıcılar
    onlineUsers,
    
    // Bağlantı yönetimi
    connect,
    disconnect,
    
    // Event yönetimi
    addListener,
    removeListener,
    send,
    
    // Kullanıcı durumu
    setUserOnline,
    setUserOffline,
    updateLastSeen,
    requestOnlineUsers,
    
    // Mesajlaşma
    sendMessage,
    markMessageAsRead,
  };
};
