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
  console.log('🚀 Dashboard - user.firstName:', user?.firstName);
  console.log('🚀 Dashboard - user.lastName:', user?.lastName);
  console.log('🚀 Dashboard - user.email:', user?.email);


  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-4 border-dashed border-primary-red-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center px-4">
                <h2 className="text-xl lg:text-2xl font-bold text-primary-dark mb-4">
                  Dashboard
                </h2>
                <p className="text-gray-600 mb-6">
                  IT Talep Sistemi ana sayfası. Burada sistem özellikleri eklenecek.
                </p>
                {isAdmin && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <a
                      href="/chat"
                      className="bg-primary-red hover:bg-primary-red-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block transition-colors"
                    >
                      Anlık Mesajlaşma
                    </a>
                  </div>
                )}
                {isUser && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                      onClick={() => setActiveTab('createRequest')}
                      className="bg-primary-red hover:bg-primary-red-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Yeni Talep Oluştur
                    </button>
                    <button
                      onClick={() => setActiveTab('myRequests')}
                      className="bg-primary-dark hover:bg-primary-dark-800 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Taleplerimi Görüntüle
                    </button>
                    <button
                      onClick={() => setActiveTab('messageCenter')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Mesaj Merkezi
                    </button>
                  </div>
                )}
                {isSupport && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <button
                      onClick={() => setActiveTab('kanbanBoard')}
                      className="bg-primary-red hover:bg-primary-red-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Kanban Paneli
                    </button>
                    <button
                      onClick={() => setActiveTab('messageManagement')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Mesaj Yönetimi
                    </button>
                    <a
                      href="/chat"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium inline-block transition-colors"
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:h-screen">
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="lg:hidden bg-primary-dark text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">IT Talep Sistemi</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-primary-red transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      {(isAdmin || isUser || isSupport) && (
        <div className={`${isMobileMenuOpen ? 'fixed z-50 top-0 left-0 right-0' : 'hidden'} lg:block w-full lg:w-64 bg-white shadow-lg lg:h-full lg:relative lg:z-auto`}>
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-primary-dark">
                {isAdmin ? 'Admin Panel' : isSupport ? 'Destek Paneli' : 'Kullanıcı Paneli'}
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Kullanıcı Bilgileri */}
            <div className="mb-6 p-4 bg-primary-red-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary-red rounded-full flex items-center justify-center text-white font-semibold">
                  {(user?.firstName || user?.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-primary-dark">
                    {(() => {
                      // JWT token'dan direkt unique_name'i al
                      const token = localStorage.getItem('token');
                      if (token) {
                        try {
                          const decoded = JSON.parse(atob(token.split('.')[1]));
                          const uniqueName = decoded.unique_name;
                          console.log('🔍 Sidebar - unique_name from JWT:', uniqueName);
                          
                          if (Array.isArray(uniqueName) && uniqueName.length > 0) {
                            // Türkçe karakter sorununu düzelt
                            return decodeURIComponent(escape(uniqueName[0]));
                          } else if (typeof uniqueName === 'string') {
                            // Türkçe karakter sorununu düzelt
                            return decodeURIComponent(escape(uniqueName));
                          }
                        } catch (error) {
                          console.error('JWT decode error:', error);
                        }
                      }
                      
                      // Fallback
                      return user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'Kullanıcı';
                    })()}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {user?.userType?.name || 'Kullanıcı'}
                  </p>
                </div>
              </div>
              
              {/* Çevrimiçi Durumu */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-red rounded-full animate-pulse"></div>
                <span className="text-xs text-primary-red font-medium">Çevrimiçi</span>
              </div>
            </div>
            
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-primary-red-100 text-primary-red'
                    : 'text-primary-dark hover:bg-primary-red-50'
                }`}
              >
                Dashboard
              </button>
              
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('departments');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'departments'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Departman Yönetimi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('requests');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'requests'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Talep Yönetimi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('requestStatuses');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'requestStatuses'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Talep Durumu Yönetimi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('requestTypeManagement');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'requestTypeManagement'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Talep Türü Yönetimi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('supportTypes');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'supportTypes'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Destek Türü Yönetimi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'users'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Kullanıcı Yönetimi
                  </button>
                </>
              )}
              
              {isUser && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('createRequest');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'createRequest'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Yeni Talep Oluştur
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('myRequests');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'myRequests'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Taleplerim
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('messageCenter');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'messageCenter'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Mesaj Merkezi
                  </button>
                </>
              )}
              
              {isSupport && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('kanbanBoard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'kanbanBoard'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Kanban Paneli
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('messageManagement');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'messageManagement'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Mesaj Yönetimi
                  </button>
                </>
              )}
            </nav>

            {/* Çıkış Butonu */}
            <div className="mt-6 pt-4 border-t border-gray-200">
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
                className="w-full bg-primary-red hover:bg-primary-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:h-full">
        {/* Main Content Area */}
        <main className="flex-1 lg:overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
