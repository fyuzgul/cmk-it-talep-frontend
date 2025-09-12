import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../hooks/useRequests';

const CreateRequest = ({ onRequestCreated }) => {
  const { user } = useAuth();
  const { 
    requestTypes, 
    createRequest, 
    loading, 
    error 
  } = useRequests();

  const [formData, setFormData] = useState({
    requestTypeId: '',
    description: '',
    screenshotFile: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // fetchSupportTypes hook'un kendi useEffect'inde çağrılıyor

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      screenshotFile: file
    }));
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
        description: formData.description,
        screenshotFilePath: formData.screenshotFile ? formData.screenshotFile.name : null
      };

      await createRequest(requestData);
      setSubmitSuccess(true);
      setFormData({
        requestTypeId: '',
        description: '',
        screenshotFile: null
      });
      
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeni Talep Oluştur</h2>
        
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Talep Türü */}
          <div>
            <label htmlFor="requestTypeId" className="block text-sm font-medium text-gray-700 mb-2">
              Talep Türü *
            </label>
            <select
              id="requestTypeId"
              name="requestTypeId"
              value={formData.requestTypeId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Talep türü seçin</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>




          {/* Açıklama */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Ekran Görüntüsü */}
          <div>
            <label htmlFor="screenshotFile" className="block text-sm font-medium text-gray-700 mb-2">
              Ekran Görüntüsü (Opsiyonel)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
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
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="screenshotFile"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Dosya seçin</span>
                    <input
                      id="screenshotFile"
                      name="screenshotFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">veya sürükleyip bırakın</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF dosyaları kabul edilir
                </p>
                {formData.screenshotFile && (
                  <p className="text-sm text-green-600 font-medium">
                    Seçilen dosya: {formData.screenshotFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Gönder Butonu */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                requestTypeId: '',
                description: '',
                screenshotFile: null
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Temizle
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
