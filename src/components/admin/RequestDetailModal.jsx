import React, { useState, useEffect } from 'react';
import { useRequests } from '../../hooks/useRequests';

const RequestDetailModal = ({
  request,
  onClose,
  onRequestUpdated,
  requestTypes,
  requestStatuses,
  requestResponseTypes,
  users
}) => {
  const { updateRequest, loading } = useRequests();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    supportProviderId: '',
    requestCreatorId: '',
    description: '',
    screenshotFilePath: '',
    requestStatusId: '',
    requestTypeId: '',
    requestResponseTypeId: ''
  });

  useEffect(() => {
    if (request) {
      setFormData({
        supportProviderId: request.supportProviderId || '',
        requestCreatorId: request.requestCreatorId || '',
        description: request.description || '',
        screenshotFilePath: request.screenshotFilePath || '',
        requestStatusId: request.requestStatusId || '',
        requestTypeId: request.requestTypeId || '',
        requestResponseTypeId: request.requestResponseTypeId || ''
      });
    }
  }, [request]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateRequest(request.id, formData);
      onRequestUpdated();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (request) {
      setFormData({
        supportProviderId: request.supportProviderId || '',
        requestCreatorId: request.requestCreatorId || '',
        description: request.description || '',
        screenshotFilePath: request.screenshotFilePath || '',
        requestStatusId: request.requestStatusId || '',
        requestTypeId: request.requestTypeId || '',
        requestResponseTypeId: request.requestResponseTypeId || ''
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'yeni':
        return 'bg-blue-100 text-blue-800';
      case 'işlemde':
        return 'bg-yellow-100 text-yellow-800';
      case 'tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTypeBadgeClass = (responseTypeName) => {
    switch (responseTypeName?.toLowerCase()) {
      case 'onaylandı':
        return 'bg-green-100 text-green-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Talep Detayları - #{request.id}
            </h3>
            <div className="flex space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Düzenle
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    İptal
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {request.description || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ekran Görüntüsü
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.screenshotFilePath}
                    onChange={(e) => handleInputChange('screenshotFilePath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Dosya yolu..."
                  />
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {request.screenshotFilePath || 'Ekran görüntüsü yok'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talep Eden
                </label>
                {isEditing ? (
                  <select
                    value={formData.requestCreatorId}
                    onChange={(e) => handleInputChange('requestCreatorId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seçiniz</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {request.requestCreator?.firstName} {request.requestCreator?.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destek Sağlayıcı
                </label>
                {isEditing ? (
                  <select
                    value={formData.supportProviderId}
                    onChange={(e) => handleInputChange('supportProviderId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seçiniz</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {request.supportProvider?.firstName} {request.supportProvider?.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Status and Types */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                {isEditing ? (
                  <select
                    value={formData.requestStatusId}
                    onChange={(e) => handleInputChange('requestStatusId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seçiniz</option>
                    {requestStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.requestStatus?.name)}`}>
                      {request.requestStatus?.name || '-'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talep Türü
                </label>
                {isEditing ? (
                  <select
                    value={formData.requestTypeId}
                    onChange={(e) => handleInputChange('requestTypeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seçiniz</option>
                    {requestTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {request.requestType?.name || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yanıt Türü
                </label>
                {isEditing ? (
                  <select
                    value={formData.requestResponseTypeId}
                    onChange={(e) => handleInputChange('requestResponseTypeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seçiniz</option>
                    {requestResponseTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResponseTypeBadgeClass(request.requestResponseType?.name)}`}>
                      {request.requestResponseType?.name || '-'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oluşturma Tarihi
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {formatDate(request.createdDate)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Değiştirilme Tarihi
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {formatDate(request.modifiedDate)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Silinmiş
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {request.isDeleted ? 'Evet' : 'Hayır'}
                </p>
              </div>
            </div>
          </div>

          {/* Request Responses Section */}
          {request.requestResponses && request.requestResponses.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Talep Yanıtları</h4>
              <div className="space-y-3">
                {request.requestResponses.map((response, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{response.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(response.createdDate)} - {response.user?.firstName} {response.user?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
