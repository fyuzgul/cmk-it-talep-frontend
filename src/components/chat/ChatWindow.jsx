import React, { useState, useEffect, useRef } from 'react';
import signalrService from '../../services/signalrService';
import { useAuth } from '../../contexts/AuthContext';

const ChatWindow = ({ requestId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();

  const roomName = `request_${requestId}`;

  useEffect(() => {
    // SignalR bağlantısını kontrol et
    if (!signalrService.isConnected) {
      console.log('SignalR not connected, attempting to connect...');
      // Bu durumda AuthContext'ten token alınmalı
      return;
    }

    // Odaya katıl
    signalrService.joinRoom(roomName);

    // Event listeners
    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // Event listeners'ı kaydet
    signalrService.on('message:new', handleNewMessage);
    signalrService.on('user:typing', handleUserTyping);
    signalrService.on('user:stopped-typing', handleUserStoppedTyping);
    signalrService.on('online:users', handleOnlineUsers);

    // Çevrimiçi kullanıcıları getir
    signalrService.getOnlineUsers();

    // Cleanup
    return () => {
      signalrService.off('message:new', handleNewMessage);
      signalrService.off('user:typing', handleUserTyping);
      signalrService.off('user:stopped-typing', handleUserStoppedTyping);
      signalrService.off('online:users', handleOnlineUsers);
      signalrService.leaveRoom(roomName);
    };
  }, [requestId, user?.id, roomName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await signalrService.sendMessageToGroup(roomName, {
        text: newMessage,
        senderId: user.id,
        senderName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || 'Bilinmeyen',
        timestamp: new Date().toISOString()
      });

      setNewMessage('');
      setIsTyping(false);
      await signalrService.stopTyping(roomName);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      signalrService.startTyping(roomName);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await signalrService.stopTyping(roomName);
    }, 1000);
  };

  const formatMessageTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Talep #{requestId} - Mesajlaşma
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {onlineUsers.length} çevrimiçi
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Henüz mesaj yok. İlk mesajı siz gönderin!
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.senderName || 'Bilinmeyen'}
                  </span>
                  <div className="flex items-center space-x-1">
                    {isUserOnline(message.senderId) && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    <span className="text-xs opacity-75">
                      {formatMessageTime(message.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{message.text || message.message}</p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {typingUsers.length === 1 ? 'Birisi yazıyor...' : `${typingUsers.length} kişi yazıyor...`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
