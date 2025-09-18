import api from './api';

const fileService = {
  // Dosya adından dosya verisini çekmeye çalış
  async getFileByFileName(fileName) {
    try {
      // Console log removed
      
      // Önce tüm request'leri çek
      // Console log removed
      const requestsResponse = await api.get('/Request');
      const requests = requestsResponse.data;
      // Console log removed
      
      // Screenshot dosyasını ara
      for (const request of requests) {
        if (request.screenshotFileName === fileName || 
            request.screenshotFilePath?.includes(fileName)) {
          // Console log removed
          try {
            const response = await api.get(`/File/request/${request.id}/screenshot`);
            // Console log removed
            return response.data;
          } catch (screenshotError) {
            // Console log removed
            // Continue searching in responses
          }
        }
      }

      // RequestResponse'larda ara
      // Console log removed
      const responsesResponse = await api.get('/RequestResponse');
      const responses = responsesResponse.data;
      // Console log removed
      
      for (const response of responses) {
        if (response.fileName === fileName || 
            response.filePath?.includes(fileName)) {
          // Console log removed
          try {
            const fileResponse = await api.get(`/File/response/${response.id}/file`);
            // Console log removed
            return fileResponse.data;
          } catch (responseError) {
            // Console log removed
            // Continue searching
          }
        }
      }

      // Console log removed
      
      // Son çare olarak, dosya adını içeren tüm alanları kontrol et
      // Console log removed
      try {
        // Tüm request'lerde daha geniş arama
        for (const request of requests) {
          const requestStr = JSON.stringify(request).toLowerCase();
          if (requestStr.includes(fileName.toLowerCase())) {
            // Console log removed
            // Bu durumda dosya bilgilerini döndür ama base64 olmayabilir
            return {
              fileName: fileName,
              filePath: request.screenshotFilePath,
              mimeType: this.getMimeTypeFromFileName(fileName),
              foundIn: 'request',
              requestId: request.id,
              hasBase64: false
            };
          }
        }
        
        // Tüm response'larda daha geniş arama
        for (const response of responses) {
          const responseStr = JSON.stringify(response).toLowerCase();
          if (responseStr.includes(fileName.toLowerCase())) {
            // Console log removed
            return {
              fileName: fileName,
              filePath: response.filePath,
              mimeType: this.getMimeTypeFromFileName(fileName),
              foundIn: 'response',
              responseId: response.id,
              hasBase64: false
            };
          }
        }
      } catch (searchError) {
        // Console log removed
      }
      
      return null;
    } catch (error) {
      // Console log removed
      // Console log removed
      return null;
    }
  },

  // Dosya adından MIME type'ı tahmin et
  getMimeTypeFromFileName(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'mp3':
        return 'audio/mp3';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
};

export default fileService;
