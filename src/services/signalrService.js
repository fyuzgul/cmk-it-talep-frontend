import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
    this.onlineUsers = [];
    this.globalListeners = new Map();
  }

  // Bağlantı durumunu kontrol et
  isConnectionActive() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }

  // isConnected getter
  get isConnected() {
    return this.isConnectionActive();
  }

  // Online users getter
  getOnlineUsersList() {
    return this.onlineUsers;
  }

  async connect(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    // Eğer zaten bağlıysa
    if (this.isConnectionActive()) {
      // SignalR already connected
      return;
    }

    // Mevcut bağlantıyı kapat
    if (this.connection) {
      await this.disconnect();
    }

    try {
      // Connecting to SignalR
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/messageHub', {
          accessTokenFactory: () => {
            // Providing token for SignalR
            return token;
          },
          withCredentials: true,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Event listeners
      this.connection.onclose((error) => {
        // SignalR connection closed
        this.emit('disconnected', error);
      });

      this.connection.onreconnecting((error) => {
        // SignalR reconnecting
        this.emit('reconnecting', error);
      });

      this.connection.onreconnected((connectionId) => {
        // SignalR reconnected
        this.connectionAttempts = 0;
        this.emit('reconnected', connectionId);
      });

      // Hub events
      this.connection.on('UserOnline', (userId) => {
        // User online
        this.onlineUsers.push(userId);
        this.emit('user:online', { userId });
      });

      this.connection.on('UserOffline', (userId) => {
        // User offline
        this.onlineUsers = this.onlineUsers.filter(id => id !== userId);
        this.emit('user:offline', { userId });
      });

      this.connection.on('OnlineUsers', (users) => {
        // Online users received
        this.onlineUsers = users;
        this.emit('online:users', users);
      });

      this.connection.on('ReceiveMessage', (message) => {
        // Console log removed
        this.emit('message:new', message);
      });

      this.connection.on('UserTyping', (userId) => {
        // Console log removed
        this.emit('user:typing', { userId });
      });

      this.connection.on('UserStoppedTyping', (userId) => {
        // Console log removed
        this.emit('user:stopped-typing', { userId });
      });

      this.connection.on('TypingUsers', (userIds) => {
        // Console log removed
        this.emit('typing:users', userIds);
      });

      this.connection.on('MessageRead', (messageId, connectionId) => {
        // Console log removed
        this.emit('message:read', { messageId, connectionId });
      });

      this.connection.on('UserJoined', (connectionId) => {
        // Console log removed
        this.emit('user:joined', { connectionId });
      });

      this.connection.on('UserLeft', (connectionId) => {
        // Console log removed
        this.emit('user:left', { connectionId });
      });

      // Bağlantıyı başlat
      await this.connection.start();
      this.connectionAttempts = 0;
      
      // Console log removed
      this.emit('connected');
      
    } catch (error) {
      // Console log removed
      this.connectionAttempts++;
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      // Console log removed
      try {
        await this.connection.stop();
      } catch (error) {
        // Console log removed
      }
    }
    
    this.connection = null;
    this.emit('disconnected');
  }

  // Event management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

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

  // Hub methods
  async invoke(methodName, ...args) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return await this.connection.invoke(methodName, ...args);
    } else {
      // Console log removed
      throw new Error('SignalR not connected');
    }
  }

  async getOnlineUsers() {
    return await this.invoke('GetOnlineUsers');
  }

  async joinRoom(roomName) {
    return await this.invoke('JoinRoom', roomName);
  }

  async leaveRoom(roomName) {
    return await this.invoke('LeaveRoom', roomName);
  }

  async sendMessage(requestId, message, filePath = null) {
    return await this.invoke('SendMessage', requestId, message, filePath);
  }

  async sendMessageToUser(targetUserId, message) {
    return await this.invoke('SendMessageToUser', targetUserId, message);
  }

  async sendMessageToGroup(groupName, message) {
    return await this.invoke('SendMessageToGroup', groupName, message);
  }

  async markMessageAsRead(messageId) {
    return await this.invoke('MarkMessageAsRead', messageId);
  }

  async sendTypingStatus(groupName, isTyping) {
    return await this.invoke('SendTypingStatus', groupName, isTyping);
  }

  async startTyping(groupName) {
    return await this.invoke('StartTyping', groupName);
  }

  async stopTyping(groupName) {
    return await this.invoke('StopTyping', groupName);
  }

  async getTypingUsers(groupName) {
    return await this.invoke('GetTypingUsers', groupName);
  }

  async updateLastSeen() {
    return await this.invoke('UpdateLastSeen');
  }

  async isUserOnline(userId) {
    return await this.invoke('IsUserOnline', userId);
  }

  async getUserLastSeen(userId) {
    return await this.invoke('GetUserLastSeen', userId);
  }
}

// Singleton instance
const signalrService = new SignalRService();
export default signalrService;
