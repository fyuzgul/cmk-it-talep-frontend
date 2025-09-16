import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import signalrService from '../services/signalrService';
import userService from '../services/userService';
import DepartmentManagement from './admin/DepartmentManagement';
import RequestManagement from './admin/RequestManagement';
import RequestStatusManagement from './admin/RequestStatusManagement';
import RequestTypeManagement from './admin/RequestTypeManagement';
import SupportTypeManagement from './admin/SupportTypeManagement';
import UserManagement from './admin/UserManagement';
import CreateRequest from './user/CreateRequest';
import MyRequests from './user/MyRequests';
import MessageCenter from './user/MessageCenter';
import SupportKanbanBoard from './support/SupportKanbanBoard';
import MessageManagement from './support/MessageManagement';

const Dashboard = () => {
  console.log('🚀 Dashboard component rendered');
  
  const { user, logout } = useAuth();
  console.log('🚀 Dashboard - user from useAuth:', user);


  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const isAdmin = user?.userType?.name === 'admin' || user?.typeId === 1;
  const isUser = user?.userType?.name === 'user' || user?.typeId === 2;
  const isSupport = user?.userType?.name === 'support' || user?.typeId === 3;
  
  console.log('🚀 Dashboard - activeTab:', activeTab);
  console.log('🚀 Dashboard - isUser:', isUser, 'isSupport:', isSupport);

  // SignalR event listeners - global state kullan
  useEffect(() => {
    // Global online users state'ini al
    const userIds = signalrService.getOnlineUsersList();
    if (userIds && userIds.length > 0) {
      userService.getUsersByIds(userIds).then(response => {
        if (response.success) {
          const usersWithIds = response.data.map(user => ({
            userId: user.id,
            user: user
          }));
          setOnlineUsers(usersWithIds);
        }
      }).catch(error => {
        console.error('Error fetching user details:', error);
      });
    }
    
    // SignalR bağlantısı kontrolü
    if (signalrService.isConnected) {
      console.log('🔵 Dashboard - SignalR connected, waiting for online users...');
    } else {
      console.log('❌ Dashboard - SignalR not connected');
    }

    // Global state değişikliklerini dinle
    const handleOnlineUsersChange = () => {
      const userIds = signalrService.getOnlineUsersList();
      if (userIds && userIds.length > 0) {
        userService.getUsersByIds(userIds).then(response => {
          if (response.success) {
            const usersWithIds = response.data.map(user => ({
              userId: user.id,
              user: user
            }));
            setOnlineUsers(usersWithIds);
          }
        }).catch(error => {
          console.error('Error fetching user details:', error);
        });
      } else {
        setOnlineUsers([]);
      }
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

  // Kullanıcıyı offline yapma fonksiyonu
  const setUserOffline = async (userId) => {
    try {
      // Bu fonksiyon şimdilik boş, gerekirse API endpoint'i eklenebilir
      console.log('Setting user offline:', userId);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      // Admin tabs
      case 'departments':
        return <DepartmentManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'requestStatuses':
        return <RequestStatusManagement />;
      case 'requestTypeManagement':
        return <RequestTypeManagement />;
      case 'supportTypes':
        return <SupportTypeManagement />;
      case 'users':
        return <UserManagement />;
      
      // User tabs
      case 'createRequest':
        return <CreateRequest onRequestCreated={() => setRefreshKey(prev => prev + 1)} />;
      case 'myRequests':
        return <MyRequests key={refreshKey} />;
      case 'messageCenter':
        return <MessageCenter key={refreshKey} />;
      
      // Support tabs
      case 'kanbanBoard':
        return <SupportKanbanBoard />;
      case 'messageManagement':
        return <MessageManagement />;
      
      // Test panelleri (herkes için)
      
      case 'dashboard':
      default:
        return (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Dashboard
                </h2>
                <p className="text-gray-600">
                  IT Talep Sistemi ana sayfası. Burada sistem özellikleri eklenecek.
                </p>
                {isAdmin && (
                  <div className="mt-6 space-x-4">
                    <a
                      href="/chat"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block"
                    >
                      Anlık Mesajlaşma
                    </a>
                  </div>
                )}
                {isUser && (
                  <div className="mt-6 space-x-4">
                    <button
                      onClick={() => setActiveTab('createRequest')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Yeni Talep Oluştur
                    </button>
                    <button
                      onClick={() => setActiveTab('myRequests')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Taleplerimi Görüntüle
                    </button>
                    <button
                      onClick={() => setActiveTab('messageCenter')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Mesaj Merkezi
                    </button>
                    <a
                      href="/chat"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block"
                    >
                      Anlık Mesajlaşma
                    </a>
                  </div>
                )}
                {isSupport && (
                  <div className="mt-6 space-x-4">
                    <button
                      onClick={() => setActiveTab('kanbanBoard')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Kanban Paneli
                    </button>
                    <button
                      onClick={() => setActiveTab('messageManagement')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      Mesaj Yönetimi
                    </button>
                    <a
                      href="/chat"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block"
                    >
                      Anlık Mesajlaşma
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {(isAdmin || isUser || isSupport) && (
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isAdmin ? 'Admin Panel' : isSupport ? 'Destek Paneli' : 'Kullanıcı Paneli'}
            </h2>
            
              {/* Çevrimiçi Kullanıcılar */}
              <div className="mb-6 p-3 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  Çevrimiçi Kullanıcılar ({onlineUsers.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {onlineUsers.map((onlineUser, index) => {
                    const userId = onlineUser.userId;
                    const userInfo = onlineUser.user;
                    const userName = userInfo?.firstName && userInfo?.lastName
                      ? `${userInfo.firstName} ${userInfo.lastName}`
                      : userInfo?.email || `Kullanıcı ${userId}`;

                    return (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 truncate">{userName}</span>
                      </div>
                    );
                  })}
                  {onlineUsers.length === 0 && (
                    <div className="text-xs text-gray-500">Çevrimiçi kullanıcı yok</div>
                  )}
                </div>
              </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('departments')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'departments'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Departman Yönetimi
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'requests'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Talep Yönetimi
                  </button>
                  <button
                    onClick={() => setActiveTab('requestStatuses')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'requestStatuses'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Talep Durumu Yönetimi
                  </button>
                  <button
                    onClick={() => setActiveTab('requestTypeManagement')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'requestTypeManagement'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Talep Türü Yönetimi
                  </button>
                  <button
                    onClick={() => setActiveTab('supportTypes')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'supportTypes'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Destek Türü Yönetimi
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'users'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Kullanıcı Yönetimi
                  </button>
                </>
              )}
              
              {isUser && (
                <>
                  <button
                    onClick={() => setActiveTab('createRequest')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'createRequest'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Yeni Talep Oluştur
                  </button>
                  <button
                    onClick={() => setActiveTab('myRequests')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'myRequests'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Taleplerim
                  </button>
                  <button
                    onClick={() => setActiveTab('messageCenter')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'messageCenter'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Mesaj Merkezi
                  </button>
                </>
              )}
              
              {isSupport && (
                <>
                  <button
                    onClick={() => setActiveTab('kanbanBoard')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'kanbanBoard'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Kanban Paneli
                  </button>
                  <button
                    onClick={() => setActiveTab('messageManagement')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'messageManagement'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Mesaj Yönetimi
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  IT Talep Sistemi
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* SignalR Bağlantı Durumu */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-600">
                    Çevrimiçi
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.department?.name} - {user?.userType?.name}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Çıkış yapmadan önce offline yap
                    if (user?.id) {
                      try {
                        console.log('🔴 Kullanıcı çıkış yapıyor, offline yapılıyor...', user.id);
                        
                        // HTTP API ile offline yap
                        await setUserOffline(user.id);
                        console.log('✅ HTTP API - Kullanıcı offline yapıldı');
                        
                        // SignalR ile offline yap (gerçek zamanlı)
                        // SignalR bağlantısı otomatik olarak kapanacak
                      } catch (err) {
                        console.error('❌ Offline yapma hatası:', err);
                      }
                    }
                    logout();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
