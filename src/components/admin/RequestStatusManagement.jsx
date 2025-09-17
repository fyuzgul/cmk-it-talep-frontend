import React, { useState } from 'react';
import { useRequests } from '../../hooks/useRequests';

const RequestStatusManagement = () => {
  const {
    requestStatuses: statuses,
    loading,
    error,
    createRequestStatus,
    updateRequestStatus,
    deleteRequestStatus,
  } = useRequests();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [editingStatus, setEditingStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Durum adı gereklidir';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingStatus) {
        // Update status - ID'yi de gönder
        const updateData = {
          id: editingStatus.id,
          name: formData.name
        };
        await updateRequestStatus(editingStatus.id, updateData);
      } else {
        // Create status
        await createRequestStatus(formData);
      }

      setShowModal(false);
      setEditingStatus(null);
      setFormData({ name: '' });
      setErrors({});
    } catch (error) {
      console.error('Error saving status:', error);
    }
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({ name: status.name });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu durumu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteRequestStatus(id);
      } catch (error) {
        console.error('Error deleting status:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingStatus(null);
    setFormData({ name: '' });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStatus(null);
    setFormData({ name: '' });
    setErrors({});
  };

  // ID'ye göre renk belirleme - Taleplerim sayfasıyla aynı renkler
  const getStatusIcon = (statusId) => {
    const statusColors = {
      1: 'from-gray-400 to-gray-500',    // Yeni
      2: 'from-blue-400 to-blue-500',   // İşlemde
      3: 'from-yellow-400 to-yellow-500', // Beklemede
      4: 'from-green-500 to-green-600',  // Çözüldü
      5: 'from-red-500 to-red-600'       // Kapalı
    };
    const iconColors = {
      1: 'text-gray-200',    // Yeni
      2: 'text-blue-200',    // İşlemde
      3: 'text-yellow-200',  // Beklemede
      4: 'text-green-100',   // Çözüldü
      5: 'text-red-100'      // Kapalı
    };
    const icons = {
      1: 'M12 6v6m0 0v6m0-6h6m-6 0H6',  // Yeni - Plus icon
      2: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', // İşlemde - Refresh icon
      3: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // Beklemede - Clock icon
      4: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // Çözüldü - Check circle icon
      5: 'M6 18L18 6M6 6l12 12' // Kapalı - X icon
    };
    
    const bgColor = statusColors[statusId] || 'from-gray-400 to-gray-500';
    const iconColor = iconColors[statusId] || 'text-gray-200';
    const iconPath = icons[statusId] || 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    
    return {
      icon: (
        <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      ),
      gradient: bgColor
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Talep Durumu Yönetimi</h1>
            <p className="mt-2 text-gray-600">Sistemdeki talep durumlarını yönetin</p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Yeni Durum</span>
          </button>
        </div>
      </div>

      {/* Statuses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statuses.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz durum yok</h3>
              <p className="mt-2 text-gray-500">İlk durumunuzu ekleyerek başlayın</p>
            </div>
          </div>
        ) : (
          statuses.map((status) => {
            const statusIcon = getStatusIcon(status.id);
            return (
              <div key={status.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 bg-gradient-to-br ${statusIcon.gradient} rounded-lg flex items-center justify-center`}>
                            {statusIcon.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {status.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Talep Durumu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(status)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(status.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Sil
                  </button>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingStatus ? 'Durum Düzenle' : 'Yeni Durum Ekle'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Durum Adı
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200`}
                  placeholder="Durum adını giriniz"
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  {editingStatus ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestStatusManagement;

