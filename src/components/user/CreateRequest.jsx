import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';
import { useSupport } from '../../hooks/useSupport';
import { usePriorityLevels } from '../../hooks/usePriorityLevels';
import { convertFileToBase64, validateFileType, validateFileSize, getFileIcon, formatFileSize } from '../../utils/fileUtils';
import Base64FileViewer from '../common/Base64FileViewer';

const CreateRequest = ({ onRequestCreated }) => {
  const { user } = useAuth();
  const { 
    requestTypes, 
    createRequest, 
    getRequestTypesBySupportType,
    loading, 
    error 
  } = useRequests();

  const { 
    supportTypes,
    loading: supportLoading 
  } = useSupport();

  const { 
    priorityLevels, 
    loading: priorityLoading,
    error: priorityError
  } = usePriorityLevels();

  const [formData, setFormData] = useState({
    supportTypeId: '',
    requestTypeId: '',
    priorityLevelId: '',
    description: '',
    screenshotFile: null,
    screenshotBase64: null,
    screenshotFileName: null,
    screenshotMimeType: null
  });

  const [filteredRequestTypes, setFilteredRequestTypes] = useState([]);
  const [isLoadingRequestTypes, setIsLoadingRequestTypes] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // fetchSupportTypes hook'un kendi useEffect'inde çağrılıyor

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'supportTypeId') {
      // Support type değiştiğinde request type'ları filtrele
      setFormData(prev => ({
        ...prev,
        supportTypeId: value,
        requestTypeId: '' // Request type'ı sıfırla
      }));
      
      if (value) {
        try {
          setIsLoadingRequestTypes(true);
          const requestTypes = await getRequestTypesBySupportType(parseInt(value));
          
          // Sort request types - "Diğer" types should come last
          const sortedRequestTypes = [...requestTypes].sort((a, b) => {
            const aIsOther = a.name.toLowerCase() === 'diğer';
            const bIsOther = b.name.toLowerCase() === 'diğer';
            
            if (aIsOther && !bIsOther) return 1;
            if (!aIsOther && bIsOther) return -1;
            
            // If both are "Diğer" or both are not "Diğer", sort alphabetically
            return a.name.localeCompare(b.name, 'tr');
          });
          
          setFilteredRequestTypes(sortedRequestTypes);
        } catch (error) {
          console.error('Error fetching request types:', error);
          setFilteredRequestTypes([]);
        } finally {
          setIsLoadingRequestTypes(false);
        }
      } else {
        setFilteredRequestTypes([]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya türü kontrolü
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain'
    ];
    if (!validateFileType(file, allowedTypes)) {
      setSubmitError('Desteklenmeyen dosya türü. Sadece resim, PDF ve metin dosyaları kabul edilir.');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (!validateFileSize(file, 5)) {
      setSubmitError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      return;
    }

    try {
      const fileData = await convertFileToBase64(file);
      setFormData(prev => ({
        ...prev,
        screenshotFile: file,
        screenshotBase64: fileData.base64,
        screenshotFileName: fileData.fileName,
        screenshotMimeType: fileData.mimeType
      }));
      setSubmitError(null);
    } catch (error) {
      setSubmitError('Dosya yüklenirken bir hata oluştu.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const requestData = {
        requestCreatorId: user.id,
        requestTypeId: parseInt(formData.requestTypeId),
        priorityLevelId: parseInt(formData.priorityLevelId),
        description: formData.description,
        screenshotFilePath: formData.screenshotFile ? formData.screenshotFile.name : null, // Backward compatibility
        screenshotBase64: formData.screenshotBase64,
        screenshotFileName: formData.screenshotFileName,
        screenshotMimeType: formData.screenshotMimeType
      };

      await createRequest(requestData);
      setSubmitSuccess(true);
      setFormData({
        supportTypeId: '',
        requestTypeId: '',
        priorityLevelId: '',
        description: '',
        screenshotFile: null,
        screenshotBase64: null,
        screenshotFileName: null,
        screenshotMimeType: null
      });
      setFilteredRequestTypes([]);
      setIsLoadingRequestTypes(false);
      
      // Callback ile parent component'i bilgilendir
      if (onRequestCreated) {
        onRequestCreated();
      }
    } catch (err) {
      setSubmitError(err.message || 'Talep oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || priorityLoading || supportLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-dark mb-6">Yeni Talep Oluştur</h2>
        
        {submitSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Talep başarıyla oluşturuldu!
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

        {priorityError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Öncelik seviyeleri yüklenirken hata oluştu: {priorityError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destek Türü */}
          <div>
            <label htmlFor="supportTypeId" className="block text-sm font-medium text-primary-dark mb-2">
              Destek Türü *
            </label>
            <select
              id="supportTypeId"
              name="supportTypeId"
              value={formData.supportTypeId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm"
            >
              <option value="">Destek türü seçin</option>
              {supportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Talep Türü */}
          <div>
            <label htmlFor="requestTypeId" className="block text-sm font-medium text-primary-dark mb-2">
              Talep Türü *
            </label>
            <select
              id="requestTypeId"
              name="requestTypeId"
              value={formData.requestTypeId}
              onChange={handleInputChange}
              required
              disabled={!formData.supportTypeId || isLoadingRequestTypes}
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingRequestTypes 
                  ? "Yükleniyor..." 
                  : formData.supportTypeId 
                    ? "Talep türü seçin" 
                    : "Önce destek türü seçin"
                }
              </option>
              {filteredRequestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Öncelik Seviyesi */}
          <div>
            <label htmlFor="priorityLevelId" className="block text-sm font-medium text-primary-dark mb-2">
              Öncelik Seviyesi *
            </label>
            <select
              id="priorityLevelId"
              name="priorityLevelId"
              value={formData.priorityLevelId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm"
            >
              <option value="">Öncelik seviyesi seçin</option>
              {priorityLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary-dark mb-2">
              Talep Açıklaması *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Talebinizi detaylı bir şekilde açıklayın..."
              className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm"
            />
          </div>

          {/* Ekran Görüntüsü */}
          <div>
            <label htmlFor="screenshotFile" className="block text-sm font-medium text-primary-dark mb-2">
              Ekran Görüntüsü (Opsiyonel)
            </label>
            <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-red-300 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex flex-col sm:flex-row text-sm text-gray-600">
                  <label
                    htmlFor="screenshotFile"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-red hover:text-primary-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-red transition-colors"
                  >
                    <span>Dosya seçin</span>
                    <input
                      id="screenshotFile"
                      name="screenshotFile"
                      type="file"
                      accept="image/*,application/pdf,text/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">veya sürükleyip bırakın</p>
                </div>
                <p className="text-xs text-gray-500">
                  Resim, PDF ve metin dosyaları kabul edilir (Max: 5MB)
                </p>
                {formData.screenshotFile && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200/50 shadow-sm">
                      <span className="text-green-600 text-lg">{getFileIcon(formData.screenshotMimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {formData.screenshotFileName}
                        </p>
                        <p className="text-xs text-green-600">
                          {formatFileSize(formData.screenshotFile.size)} • {formData.screenshotMimeType}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          screenshotFile: null,
                          screenshotBase64: null,
                          screenshotFileName: null,
                          screenshotMimeType: null
                        }))}
                        className="text-green-400 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gönder Butonu */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                requestTypeId: '',
                priorityLevelId: '',
                description: '',
                screenshotFile: null,
                screenshotBase64: null,
                screenshotFileName: null,
                screenshotMimeType: null
              })}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-primary-dark hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red transition-colors"
            >
              Temizle
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-primary-red text-white rounded-md hover:bg-primary-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
