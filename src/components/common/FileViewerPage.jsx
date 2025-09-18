import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Base64FileViewer from './Base64FileViewer';
import fileService from '../../services/fileService';

const FileViewerPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFile = async () => {
      // URL'den base64 verilerini al
      const base64Data = searchParams.get('data');
      const fileName = searchParams.get('name');
      const mimeType = searchParams.get('type');

      if (base64Data && mimeType) {
        // Query parametrelerinden gelen veri
        setFileData({
          base64Data,
          fileName: fileName || 'Dosya',
          mimeType
        });
        setLoading(false);
      } else {
        // URL path'inden dosya adını çıkar
        const pathname = location.pathname;
        const fileNameFromPath = decodeURIComponent(pathname.substring(1)); // İlk / karakterini kaldır
        
        if (fileNameFromPath && fileNameFromPath !== 'file-viewer') {
          // Dosya adından veri çekmeye çalış
          try {
            // Console log removed
            const fileInfo = await fileService.getFileByFileName(fileNameFromPath);
            // Console log removed
            
            if (fileInfo) {
              if (fileInfo.base64Data) {
                // Base64 verisi bulundu
                // Console log removed
                setFileData({
                  base64Data: fileInfo.base64Data,
                  fileName: fileInfo.fileName || fileNameFromPath,
                  mimeType: fileInfo.mimeType || fileService.getMimeTypeFromFileName(fileNameFromPath)
                });
              } else if (fileInfo.filePath) {
                // Eski filePath bulundu, direkt yönlendir
                // Console log removed
                window.location.href = fileInfo.filePath;
                return;
              } else if (fileInfo.hasBase64 === false) {
                // Dosya bulundu ama base64 verisi yok
                // Console log removed
                setError({
                  type: 'no_data',
                  message: `Dosya bulundu ancak base64 verisi mevcut değil. Dosya ${fileInfo.foundIn} içinde bulundu.`,
                  fileName: fileNameFromPath,
                  mimeType: fileService.getMimeTypeFromFileName(fileNameFromPath),
                  suggestion: 'Bu dosya eski formatta saklanmış olabilir. Lütfen dosyayı mesajlaşma sisteminden açmayı deneyin veya sistem yöneticisi ile iletişime geçin.'
                });
              } else {
                // Dosya bulundu ama veri yok
                // Console log removed
                setError({
                  type: 'no_data',
                  message: 'Dosya bulundu ancak veri içeriği mevcut değil.',
                  fileName: fileNameFromPath,
                  mimeType: fileService.getMimeTypeFromFileName(fileNameFromPath),
                  suggestion: 'Bu dosya mesajlaşma sisteminden açılmalı.'
                });
              }
            } else {
              // Dosya bulunamadı
              // Console log removed
              setError({
                type: 'no_data',
                message: 'Bu dosya için veri bulunamadı.',
                fileName: fileNameFromPath,
                mimeType: fileService.getMimeTypeFromFileName(fileNameFromPath),
                suggestion: 'Bu dosya mesajlaşma sisteminden açılmalı veya dosya sisteminde mevcut değil.'
              });
            }
          } catch (error) {
            // Console log removed
            setError({
              type: 'no_data',
              message: 'Dosya yüklenirken bir hata oluştu.',
              fileName: fileNameFromPath,
              mimeType: fileService.getMimeTypeFromFileName(fileNameFromPath),
              suggestion: 'Lütfen dosyayı mesajlaşma sisteminden açmayı deneyin.'
            });
          }
        } else {
          setError({
            type: 'invalid',
            message: 'Geçersiz dosya URL\'i.'
          });
        }
        setLoading(false);
      }
    };

    loadFile();
  }, [searchParams, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dosya yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">
            {error?.type === 'no_data' ? '📄' : '❌'}
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            {error?.type === 'no_data' ? 'Dosya Verisi Bulunamadı' : 'Dosya Bulunamadı'}
          </h1>
          <p className="text-gray-500 mb-4">
            {error?.message || 'Geçerli bir dosya verisi bulunamadı.'}
          </p>
          
          {error?.type === 'no_data' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    Dosya: {error.fileName}
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    {error.message}
                  </p>
                  {error.suggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                      <p className="text-xs text-blue-800 font-medium mb-1">💡 Öneri:</p>
                      <p className="text-xs text-blue-700">
                        {error.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Pencereyi Kapat
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ml-2"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Simple Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.close()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{fileData.fileName}</h1>
                <p className="text-sm text-gray-500">
                  {fileData.mimeType} • {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Dosya Görüntüleyici</span>
              <button
                onClick={() => window.history.back()}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Geri
              </button>
            </div>
          </div>
        </div>

        {/* Simple File Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Base64FileViewer
            base64Data={fileData.base64Data}
            fileName={fileData.fileName}
            mimeType={fileData.mimeType}
            className="w-full"
            showDownload={true}
            maxWidth="100%"
            maxHeight="80vh"
          />
        </div>
      </div>
    </div>
  );
};

export default FileViewerPage;
