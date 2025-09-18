import React, { useState } from 'react';

const Base64FileViewer = ({ 
  base64Data, 
  filePath,
  fileName, 
  mimeType, 
  className = "",
  showDownload = true,
  maxWidth = "300px",
  maxHeight = "200px"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  try {
    const hasValidBase64 = base64Data && base64Data !== 'null' && base64Data !== 'undefined';
    const hasValidFilePath = filePath && filePath !== 'null' && filePath !== 'undefined';

    if ((!hasValidBase64 && !hasValidFilePath) || !mimeType) {
      return null;
    }

    // Dosya uzantısına göre de resim kontrolü yap
    const getFileExtension = (filename) => {
      if (!filename) return '';
      return filename.split('.').pop().toLowerCase();
    };
    
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
    const fileExtension = getFileExtension(fileName);
    const isImageByExtension = imageExtensions.includes(fileExtension);
    const isImageByMimeType = mimeType && typeof mimeType === 'string' && mimeType.startsWith('image/');
    const isImage = isImageByMimeType || isImageByExtension;
    
    // imageSrc'yi component seviyesinde tanımla
    let imageSrc = null;
    if (isImage) {
      // MimeType'ı dosya uzantısına göre düzelt
      let actualMimeType = mimeType;
      if (mimeType === 'application/octet-stream' && fileExtension) {
        const mimeTypeMap = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'bmp': 'image/bmp',
          'webp': 'image/webp',
          'svg': 'image/svg+xml'
        };
        actualMimeType = mimeTypeMap[fileExtension] || mimeType;
      }
      
      imageSrc = hasValidBase64 
        ? `data:${actualMimeType};base64,${base64Data}`
        : hasValidFilePath 
          ? filePath
          : null;
    }
    
    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType && typeof mimeType === 'string' && mimeType.startsWith('text/');
    const isVideo = mimeType && typeof mimeType === 'string' && mimeType.startsWith('video/');
    const isAudio = mimeType && typeof mimeType === 'string' && mimeType.startsWith('audio/');

  const handleDownload = () => {
    try {
      if (!base64Data || !mimeType) {
        // Console log removed
        return;
      }
      
      const link = document.createElement('a');
      link.href = `data:${mimeType};base64,${base64Data}`;
      link.download = fileName || 'dosya';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Console log removed
    }
  };

  const renderContent = () => {
    if (isImage) {
      if (!imageSrc) {
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
            <div className="flex items-center space-x-3">
              <div className="text-gray-600 text-2xl">🖼️</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                <p className="text-xs text-gray-500">Resim dosyası (veri bulunamadı)</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="mt-2 relative group">
          <div className="relative overflow-hidden rounded-lg shadow-sm">
            <img
              src={imageSrc}
              alt={fileName || 'Resim'}
              className="w-full h-auto object-cover cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ 
                maxWidth: '280px', 
                maxHeight: '300px',
                minHeight: '150px'
              }}
              onClick={() => setIsExpanded(!isExpanded)}
              onError={(e) => {
                // Console log removed
                e.target.style.display = 'none';
              }}
            />
            
            {/* Dosya adı overlay - tıklama olayını engellememesi için pointer-events-none */}
            {fileName && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg pointer-events-none">
                <p className="text-white text-xs font-medium truncate">
                  {fileName}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="text-red-600 text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">PDF Dosyası</p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  const newWindow = window.open();
                  newWindow.document.write(`
                    <html>
                      <head><title>${fileName}</title></head>
                      <body style="margin:0; padding:0;">
                        <iframe src="data:${mimeType};base64,${base64Data}" 
                                style="width:100%; height:100vh; border:none;" 
                                title="${fileName}">
                        </iframe>
                      </body>
                    </html>
                  `);
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                title="PDF'i Görüntüle"
              >
                👁️
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                title="İndir"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600 text-2xl">🎥</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Video Dosyası</p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  const newWindow = window.open();
                  newWindow.document.write(`
                    <html>
                      <head><title>${fileName}</title></head>
                      <body style="margin:0; padding:0; background:#000;">
                        <video controls autoplay style="width:100%; height:100vh; object-fit:contain;">
                          <source src="data:${mimeType};base64,${base64Data}" type="${mimeType}">
                          Tarayıcınız video oynatmayı desteklemiyor.
                        </video>
                      </body>
                    </html>
                  `);
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                title="Video'yu Oynat"
              >
                ▶️
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                title="İndir"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="text-purple-600 text-2xl">🎵</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Ses Dosyası</p>
            </div>
            <div className="flex space-x-1">
              <audio controls className="w-20 h-8">
                <source src={`data:${mimeType};base64,${base64Data}`} type={mimeType} />
              </audio>
              <button
                onClick={handleDownload}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                title="İndir"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="text-green-600 text-2xl">📝</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Metin Dosyası</p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  const newWindow = window.open();
                  newWindow.document.write(`
                    <html>
                      <head><title>${fileName}</title></head>
                      <body style="margin:20px; font-family: monospace; white-space: pre-wrap;">
                        ${atob(base64Data)}
                      </body>
                    </html>
                  `);
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                title="Metni Görüntüle"
              >
                👁️
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                title="İndir"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Diğer dosya türleri için genel görünüm
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs">
        <div className="flex items-center space-x-3">
          <div className="text-gray-600 text-2xl">📎</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">{mimeType}</p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={handleDownload}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
              title="İndir"
            >
              ⬇️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {renderContent()}
      
      {/* Dosya ismini sadece resim olmayan dosyalar için göster */}
      {fileName && !isImage && (
        <div className="mt-2 text-xs text-gray-500 truncate">
          {fileName}
        </div>
      )}

      {showDownload && !isImage && (
        <button
          onClick={handleDownload}
          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          İndir
        </button>
      )}

      {/* Genişletilmiş görünüm modal */}
      {isExpanded && isImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
          style={{ zIndex: 9999 }}
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={imageSrc}
              alt={fileName || 'Resim'}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Kapatma ve İndirme Butonları */}
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <button
                onClick={handleDownload}
                className="bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="İndir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="Kapat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Dosya ismini modal'da göster */}
            {fileName && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg text-center">
                {fileName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    // Console log removed
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs">
        <div className="flex items-center space-x-3">
          <div className="text-red-600 text-2xl">⚠️</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">Dosya görüntülenemedi</p>
            <p className="text-xs text-red-500">Bir hata oluştu</p>
          </div>
        </div>
      </div>
    );
  }
};

export default Base64FileViewer;
