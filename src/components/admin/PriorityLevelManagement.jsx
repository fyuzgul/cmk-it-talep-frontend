import React, { useState } from 'react';
import { usePriorityLevels } from '../../hooks/usePriorityLevels';

const PriorityLevelManagement = () => {
  const {
    priorityLevels,
    loading,
    error,
    createPriorityLevel,
    updatePriorityLevel,
    deletePriorityLevel,
  } = usePriorityLevels();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [editingPriority, setEditingPriority] = useState(null);
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
      newErrors.name = 'Öncelik seviyesi adı gereklidir';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingPriority) {
        // Update priority level - ID'yi de gönder
        const updateData = {
          id: editingPriority.id,
          name: formData.name
        };
        await updatePriorityLevel(editingPriority.id, updateData);
      } else {
        // Create priority level
        await createPriorityLevel(formData);
      }

      setShowModal(false);
      setEditingPriority(null);
      setFormData({ name: '' });
      setErrors({});
    } catch (error) {
      console.error('Error saving priority level:', error);
    }
  };

  const handleEdit = (priority) => {
    setEditingPriority(priority);
    setFormData({ name: priority.name });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu öncelik seviyesini silmek istediğinizden emin misiniz?')) {
      try {
        await deletePriorityLevel(id);
      } catch (error) {
        console.error('Error deleting priority level:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingPriority(null);
    setFormData({ name: '' });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPriority(null);
    setFormData({ name: '' });
    setErrors({});
  };

  // Priority level'a göre renk belirleme
  const getPriorityIcon = (priorityId) => {
    const priorityColors = {
      1: 'from-red-400 to-red-500',      // Acil
      2: 'from-orange-400 to-orange-500', // Öncelikli
      3: 'from-blue-400 to-blue-500',    // Normal
      4: 'from-green-400 to-green-500'   // Düşük
    };
    const iconColors = {
      1: 'text-red-200',      // Acil
      2: 'text-orange-200',   // Öncelikli
      3: 'text-blue-200',     // Normal
      4: 'text-green-200'     // Düşük
    };
    const icons = {
      1: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', // Acil - Warning icon
      2: 'M13 10V3L4 14h7v7l9-11h-7z', // Öncelikli - Lightning icon
      3: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // Normal - Check circle icon
      4: 'M5 13l4 4L19 7' // Düşük - Check icon
    };
    
    const bgColor = priorityColors[priorityId] || 'from-gray-400 to-gray-500';
    const iconColor = iconColors[priorityId] || 'text-gray-200';
    const iconPath = icons[priorityId] || 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    
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
            <h1 className="text-3xl font-bold text-gray-900">Öncelik Seviyesi Yönetimi</h1>
            <p className="mt-2 text-gray-600">Sistemdeki öncelik seviyelerini yönetin</p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Yeni Öncelik Seviyesi</span>
          </button>
        </div>
      </div>

      {/* Priority Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {priorityLevels.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz öncelik seviyesi yok</h3>
              <p className="mt-2 text-gray-500">İlk öncelik seviyenizi ekleyerek başlayın</p>
            </div>
          </div>
        ) : (
          priorityLevels.map((priority) => {
            const priorityIcon = getPriorityIcon(priority.id);
            return (
              <div key={priority.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 bg-gradient-to-br ${priorityIcon.gradient} rounded-lg flex items-center justify-center`}>
                            {priorityIcon.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {priority.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Öncelik Seviyesi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(priority)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(priority.id)}
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
                  {editingPriority ? 'Öncelik Seviyesi Düzenle' : 'Yeni Öncelik Seviyesi Ekle'}
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
                  Öncelik Seviyesi Adı
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
                  placeholder="Öncelik seviyesi adını giriniz"
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
                  {editingPriority ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityLevelManagement;
