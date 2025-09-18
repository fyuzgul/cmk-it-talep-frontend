import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Socket bağlantısını başlat
  connect(token) {
    if (this.socket && this.isConnected) {
      // Console log removed
      return;
    }

    try {
      this.socket = io('https://localhost:7097', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        // Console log removed
        this.isConnected = true;
        this.emit('socket:connected', { socketId: this.socket.id });
      });

      this.socket.on('disconnect', (reason) => {
        // Console log removed
        this.isConnected = false;
        this.emit('socket:disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        // Console log removed
        this.emit('socket:error', { error });
      });

      // Backend'den gelen UserStatusChanged event'i
      this.socket.on('UserStatusChanged', (data) => {
        // Console log removed
        this.emit('user:status-changed', data);
      });

      // Online status güncellemeleri (eski format - fallback)
      this.socket.on('user:online', (data) => {
        // Console log removed
        this.emit('user:online', data);
      });

      this.socket.on('user:offline', (data) => {
        // Console log removed
        this.emit('user:offline', data);
      });

      this.socket.on('online:users', (users) => {
        // Console log removed
        this.emit('online:users', users);
      });

      // Mesaj güncellemeleri
      this.socket.on('message:new', (message) => {
        // Console log removed
        this.emit('message:new', message);
      });

      this.socket.on('message:read', (data) => {
        // Console log removed
        this.emit('message:read', data);
      });

    } catch (error) {
      // Console log removed
    }
  }

  // Socket bağlantısını kapat
  disconnect() {
    if (this.socket) {
      // Console log removed
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event dinleyici ekle
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Event dinleyici kaldır
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Event emit et
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Console log removed:`, error);
        }
      });
    }
  }

  // Socket'e mesaj gönder
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      // Console log removed
    }
  }

  // Kullanıcıyı çevrimiçi yap
  setUserOnline(userId) {
    this.send('user:set-online', { userId });
  }

  // Kullanıcıyı çevrimdışı yap
  setUserOffline(userId) {
    this.send('user:set-offline', { userId });
  }

  // Son görülme zamanını güncelle
  updateLastSeen() {
    this.send('user:update-last-seen', {});
  }

  // Çevrimiçi kullanıcıları iste
  requestOnlineUsers() {
    this.send('online:request-users', {});
  }

  // Mesaj gönder
  sendMessage(messageData) {
    this.send('message:send', messageData);
  }

  // Mesajı okundu işaretle
  markMessageAsRead(messageId) {
    this.send('message:mark-read', { messageId });
  }

  // Bağlantı durumunu kontrol et
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  // Socket ID'yi al
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
