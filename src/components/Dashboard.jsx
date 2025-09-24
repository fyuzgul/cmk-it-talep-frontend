import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import signalrService from '../services/signalrService';
import userService from '../services/userService';
import api from '../services/api';
import ErrorBoundary from './common/ErrorBoundary';
import DepartmentManagement from './admin/DepartmentManagement';
import RequestManagement from './admin/RequestManagement';
import RequestStatusManagement from './admin/RequestStatusManagement';
import RequestTypeManagement from './admin/RequestTypeManagement';
import SupportTypeManagement from './admin/SupportTypeManagement';
import UserManagement from './admin/UserManagement';
import PriorityLevelManagement from './admin/PriorityLevelManagement';
import CreateRequest from './user/CreateRequest';
import MyRequests from './user/MyRequests';
import MessageCenter from './user/MessageCenter';
import SupportKanbanBoard from './support/SupportKanbanBoard';
import MessageManagement from './support/MessageManagement';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    resolvedRequests: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.userType?.name === 'admin' || user?.typeId === 1;
  const isUser = user?.userType?.name === 'user' || user?.typeId === 2;
  const isSupport = user?.userType?.name === 'support' || user?.typeId === 3;

  // Dashboard istatistiklerini yükle
  const loadDashboardStats = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      // Tüm talepleri çek
      const requestsResponse = await api.get('/Request');
      const requests = requestsResponse.data || [];
      
      // Talep durumlarını çek
      const statusesResponse = await api.get('/RequestStatus');
      const statuses = statusesResponse.data || [];
      
      // Kullanıcıları çek
      const usersResponse = await api.get('/User');
      const users = usersResponse.data || [];
      
      // "Kapanan" durumunu bul (ID 5)
      const closedStatus = statuses.find(status => status.id === 5);
      
      // İstatistikleri hesapla
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.requestStatusId === 1 || req.requestStatusId === 2).length;
      const resolvedRequests = requests.filter(req => req.requestStatusId === 5).length; // ID 5 = Kapanan
      const totalUsers = users.length;
      
      setDashboardStats({
        totalRequests,
        pendingRequests,
        resolvedRequests,
        totalUsers
      });
      
    } catch (error) {
      // Error loading dashboard stats - silent fail
    } finally {
      setLoading(false);
    }
  };

  // Dashboard istatistiklerini yükle
  useEffect(() => {
    if (isAdmin) {
      loadDashboardStats();
    }
  }, [isAdmin]);

  // URL parametrelerini kontrol et ve tab'ı ayarla (sadece ilk yüklemede)
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    if (tab && activeTab === 'dashboard') {
      setActiveTab(tab);
    }
  }, []);

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
        // Error fetching user details - silent fail
      });
    }
    
    // SignalR bağlantısı kontrolü

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
          // Error fetching user details - silent fail
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
    } catch (error) {
      // Error setting user offline - silent fail
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      // Admin tabs
      case 'departments':
        return <DepartmentManagement />;
      case 'requests':
        return (
          <ErrorBoundary>
            <RequestManagement />
          </ErrorBoundary>
        );
      case 'requestStatuses':
        return <RequestStatusManagement />;
      case 'requestTypeManagement':
        return <RequestTypeManagement />;
      case 'supportTypes':
        return <SupportTypeManagement />;
      case 'users':
        return <UserManagement />;
      case 'priorityLevels':
        return <PriorityLevelManagement />;
      
      // User tabs
      case 'createRequest':
        return <CreateRequest onRequestCreated={() => setRefreshKey(prev => prev + 1)} />;
      case 'myRequests':
        return <MyRequests key={refreshKey} />;
      case 'messageCenter':
        return <MessageCenter key={refreshKey} />;
      
      // Support tabs
      case 'kanbanBoard':
        return <SupportKanbanBoard onRequestSelect={setSelectedRequestId} onTabChange={setActiveTab} />;
      case 'messageManagement':
        return <MessageManagement selectedRequestId={selectedRequestId} onRequestSelected={setSelectedRequestId} />;
      
      // Test panelleri (herkes için)
      
      case 'dashboard':
      default:
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {isAdmin && (
                  <div className="space-y-8">
                    {/* Loading State for Admin Dashboard */}
                    {loading && (
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          <span className="text-sm font-medium text-gray-700">Dashboard verileri yükleniyor...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Admin Dashboard Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {/* Toplam Talep */}
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium mb-1">Toplam Talep</p>
                            <div className="text-3xl font-bold text-gray-900">
                              {loading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                              ) : (
                                dashboardStats.totalRequests
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Tüm zamanlar</p>
                          </div>
                          <div className="bg-blue-50 rounded-full p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Bekleyen Talepler */}
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium mb-1">Bekleyen Talep</p>
                            <div className="text-3xl font-bold text-orange-600">
                              {loading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                              ) : (
                                dashboardStats.pendingRequests
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">İşlem bekliyor</p>
                          </div>
                          <div className="bg-orange-50 rounded-full p-3">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Kapanan Talepler */}
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium mb-1">Kapanan Talep</p>
                            <div className="text-3xl font-bold text-green-600">
                              {loading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                              ) : (
                                dashboardStats.resolvedRequests
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Başarıyla kapatıldı</p>
                          </div>
                          <div className="bg-green-50 rounded-full p-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Toplam Kullanıcı */}
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm font-medium mb-1">Toplam Kullanıcı</p>
                            <div className="text-3xl font-bold text-purple-600">
                              {loading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                              ) : (
                                dashboardStats.totalUsers
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Kayıtlı kullanıcı</p>
                          </div>
                          <div className="bg-purple-50 rounded-full p-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aktif Kullanıcılar */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Aktif Kullanıcılar</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-600">{onlineUsers.length} çevrimiçi</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {onlineUsers.length > 0 ? (
                          onlineUsers.map((user, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                {user.user?.firstName} {user.user?.lastName}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">Şu anda çevrimiçi kullanıcı yok</p>
                        )}
                      </div>
                    </div>

                    {/* Hızlı Erişim Butonları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-50 group-hover:bg-blue-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Talep Yönetimi</h3>
                            <p className="text-sm text-gray-600 mt-1">Tüm talepleri görüntüle ve yönet</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('users')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-50 group-hover:bg-green-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Kullanıcı Yönetimi</h3>
                            <p className="text-sm text-gray-600 mt-1">Kullanıcıları yönet ve yetkilendir</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('departments')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-50 group-hover:bg-purple-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Departman Yönetimi</h3>
                            <p className="text-sm text-gray-600 mt-1">Departmanları düzenle ve yönet</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('requestTypeManagement')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-yellow-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-yellow-50 group-hover:bg-yellow-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">Talep Türleri</h3>
                            <p className="text-sm text-gray-600 mt-1">Talep kategorilerini yönet</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('requestStatuses')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-red-50 group-hover:bg-red-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Durum Yönetimi</h3>
                            <p className="text-sm text-gray-600 mt-1">Talep durumlarını düzenle</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('supportTypes')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-indigo-50 group-hover:bg-indigo-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Destek Türleri</h3>
                            <p className="text-sm text-gray-600 mt-1">Destek kategorilerini yönet</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('priorityLevels')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 group text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-orange-50 group-hover:bg-orange-100 rounded-xl p-4 transition-colors">
                            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Öncelik Seviyeleri</h3>
                            <p className="text-sm text-gray-600 mt-1">Talep öncelik seviyelerini yönet</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </div>

                  </div>
                )}
                {isUser && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                      <button
                        onClick={() => setActiveTab('createRequest')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 group text-center"
                      >
                        <div className="bg-red-50 group-hover:bg-red-100 rounded-xl p-4 w-16 h-16 mx-auto mb-4 transition-colors">
                          <svg className="w-8 h-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Yeni Talep Oluştur</h3>
                        <p className="text-sm text-gray-600 mt-2">Yeni bir talep oluşturun</p>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('myRequests')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group text-center"
                      >
                        <div className="bg-blue-50 group-hover:bg-blue-100 rounded-xl p-4 w-16 h-16 mx-auto mb-4 transition-colors">
                          <svg className="w-8 h-8 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Taleplerimi Görüntüle</h3>
                        <p className="text-sm text-gray-600 mt-2">Taleplerinizi takip edin</p>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('messageCenter')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group text-center"
                      >
                        <div className="bg-green-50 group-hover:bg-green-100 rounded-xl p-4 w-16 h-16 mx-auto mb-4 transition-colors">
                          <svg className="w-8 h-8 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Mesaj Merkezi</h3>
                        <p className="text-sm text-gray-600 mt-2">Mesajlarınızı görüntüleyin</p>
                      </button>
                    </div>
                  </div>
                )}
                {isSupport && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
                      <button
                        onClick={() => setActiveTab('kanbanBoard')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 group text-center"
                      >
                        <div className="bg-red-50 group-hover:bg-red-100 rounded-xl p-4 w-16 h-16 mx-auto mb-4 transition-colors">
                          <svg className="w-8 h-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Talep Yöntemi</h3>
                        <p className="text-sm text-gray-600 mt-2">Talepleri sürükleyip bırakarak yönetin</p>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('messageManagement')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 group text-center"
                      >
                        <div className="bg-green-50 group-hover:bg-green-100 rounded-xl p-4 w-16 h-16 mx-auto mb-4 transition-colors">
                          <svg className="w-8 h-8 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Mesaj Yönetimi</h3>
                        <p className="text-sm text-gray-600 mt-2">Mesajları yönetin</p>
                      </button>
                    </div>
                  </div>
                )}
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
                          
                          if (Array.isArray(uniqueName) && uniqueName.length > 0) {
                            // Türkçe karakter sorununu düzelt
                            return decodeURIComponent(escape(uniqueName[0]));
                          } else if (typeof uniqueName === 'string') {
                            // Türkçe karakter sorununu düzelt
                            return decodeURIComponent(escape(uniqueName));
                          }
                        } catch (error) {
                          // JWT decode error - silent fail
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
                  <button
                    onClick={() => {
                      setActiveTab('priorityLevels');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'priorityLevels'
                        ? 'bg-primary-red-100 text-primary-red'
                        : 'text-primary-dark hover:bg-primary-red-50'
                    }`}
                  >
                    Öncelik Seviyesi Yönetimi
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
                    Talep Yöntemi
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
                      // HTTP API ile offline yap
                      await setUserOffline(user.id);
                      
                      // SignalR ile offline yap (gerçek zamanlı)
                      // SignalR bağlantısı otomatik olarak kapanacak
                    } catch (err) {
                      // Offline yapma hatası - silent fail
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
