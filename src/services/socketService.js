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
      console.log('Socket zaten bağlı');
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
        console.log('🔌 Socket.IO bağlandı:', this.socket.id);
        this.isConnected = true;
        this.emit('socket:connected', { socketId: this.socket.id });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO bağlantısı kesildi:', reason);
        this.isConnected = false;
        this.emit('socket:disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO bağlantı hatası:', error);
        this.emit('socket:error', { error });
      });

      // Backend'den gelen UserStatusChanged event'i
      this.socket.on('UserStatusChanged', (data) => {
        console.log(`🔄 Kullanıcı durumu değişti: ${data.userId} - ${data.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}`);
        this.emit('user:status-changed', data);
      });

      // Online status güncellemeleri (eski format - fallback)
      this.socket.on('user:online', (data) => {
        console.log('🟢 Kullanıcı çevrimiçi oldu:', data);
        this.emit('user:online', data);
      });

      this.socket.on('user:offline', (data) => {
        console.log('🔴 Kullanıcı çevrimdışı oldu:', data);
        this.emit('user:offline', data);
      });

      this.socket.on('online:users', (users) => {
        console.log('👥 Çevrimiçi kullanıcılar güncellendi:', users);
        this.emit('online:users', users);
      });

      // Mesaj güncellemeleri
      this.socket.on('message:new', (message) => {
        console.log('💬 Yeni mesaj:', message);
        this.emit('message:new', message);
      });

      this.socket.on('message:read', (data) => {
        console.log('✅ Mesaj okundu:', data);
        this.emit('message:read', data);
      });

    } catch (error) {
      console.error('❌ Socket bağlantısı kurulamadı:', error);
    }
  }

  // Socket bağlantısını kapat
  disconnect() {
    if (this.socket) {
      console.log('🔌 Socket bağlantısı kapatılıyor...');
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
          console.error(`Event callback hatası (${event}):`, error);
        }
      });
    }
  }

  // Socket'e mesaj gönder
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket bağlı değil, mesaj gönderilemedi:', event, data);
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
