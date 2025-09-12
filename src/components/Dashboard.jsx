import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DepartmentManagement from './admin/DepartmentManagement';
import RequestManagement from './admin/RequestManagement';
import RequestResponseTypeManagement from './admin/RequestResponseTypeManagement';
import RequestStatusManagement from './admin/RequestStatusManagement';
import RequestTypeManagement from './admin/RequestTypeManagement';
import SupportTypeManagement from './admin/SupportTypeManagement';
import UserManagement from './admin/UserManagement';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isAdmin = user?.userType?.name === 'admin' || user?.typeId === 1;

  const renderContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'requestTypes':
        return <RequestResponseTypeManagement />;
      case 'requestStatuses':
        return <RequestStatusManagement />;
      case 'requestTypeManagement':
        return <RequestTypeManagement />;
      case 'supportTypes':
        return <SupportTypeManagement />;
      case 'users':
        return <UserManagement />;
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
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {isAdmin && (
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>
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
                            onClick={() => setActiveTab('requestTypes')}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                              activeTab === 'requestTypes'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            Talep/İstek Türü Yönetimi
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
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.department?.name} - {user?.userType?.name}
                  </div>
                </div>
                <button
                  onClick={logout}
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
