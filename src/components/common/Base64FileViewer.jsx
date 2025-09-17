import React, { useState } from 'react';

const Base64FileViewer = ({ 
  base64Data, 
  fileName, 
  mimeType, 
  className = "",
  showDownload = true,
  maxWidth = "300px",
  maxHeight = "200px"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!base64Data || !mimeType) {
    return null;
  }

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const isText = mimeType.startsWith('text/');
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = fileName || 'dosya';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="p-4">
          <img
            src={`data:${mimeType};base64,${base64Data}`}
            alt={fileName || 'Resim'}
            className="max-w-full max-h-full object-contain rounded cursor-pointer"
            style={{ maxWidth, maxHeight }}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">📄</span>
              <span className="text-sm font-medium text-gray-700">{fileName}</span>
            </div>
            <div className="flex space-x-2">
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
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
              >
                Yeni Sekmede Aç
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                İndir
              </button>
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="text-red-600 text-6xl mb-4">📄</div>
              <p className="text-lg font-medium text-gray-700 mb-2">PDF Dosyası</p>
              <p className="text-sm text-gray-500 mb-4">{fileName}</p>
              <div className="space-x-2">
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  PDF'i Görüntüle
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-blue-600 text-lg mr-2">🎥</span>
              <span className="text-sm font-medium text-gray-700">{fileName}</span>
            </div>
            <div className="flex space-x-2">
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
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
              >
                Tam Ekran Aç
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                İndir
              </button>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 p-8 rounded-lg">
              <div className="text-blue-600 text-6xl mb-4">🎥</div>
              <p className="text-lg font-medium text-gray-700 mb-2">Video Dosyası</p>
              <p className="text-sm text-gray-500 mb-4">{fileName}</p>
              <div className="space-x-2">
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Video'yu Oynat
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="bg-gray-100 p-4 rounded">
          <audio controls className="w-full">
            <source src={`data:${mimeType};base64,${base64Data}`} type={mimeType} />
            Tarayıcınız ses oynatmayı desteklemiyor.
          </audio>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
          <pre className="whitespace-pre-wrap">
            {atob(base64Data)}
          </pre>
        </div>
      );
    }

    // Diğer dosya türleri için genel görünüm
    return (
      <div className="bg-gray-100 p-4 rounded border-2 border-dashed border-gray-300 text-center">
        <div className="text-gray-600 text-4xl mb-2">📎</div>
        <p className="text-sm text-gray-600">Dosya</p>
        <p className="text-xs text-gray-500 mt-1">{fileName}</p>
        <p className="text-xs text-gray-400 mt-1">{mimeType}</p>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {renderContent()}
      
      {fileName && (
        <div className="mt-2 text-xs text-gray-500 truncate">
          {fileName}
        </div>
      )}

      {showDownload && (
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsExpanded(false)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={`data:${mimeType};base64,${base64Data}`}
              alt={fileName || 'Resim'}
              className="max-w-full max-h-full object-contain rounded"
            />
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Base64FileViewer;
