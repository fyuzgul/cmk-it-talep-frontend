import api from './api';

const fileService = {
  // Dosya adından dosya verisini çekmeye çalış
  async getFileByFileName(fileName) {
    try {
      console.log('🔍 FileService: Searching for file:', fileName);
      
      // Önce tüm request'leri çek
      console.log('📡 Fetching requests...');
      const requestsResponse = await api.get('/Request');
      const requests = requestsResponse.data;
      console.log('📊 Found requests:', requests?.length || 0);
      
      // Screenshot dosyasını ara
      for (const request of requests) {
        if (request.screenshotFileName === fileName || 
            request.screenshotFilePath?.includes(fileName)) {
          console.log('📸 Found screenshot file in request:', request.id);
          try {
            const response = await api.get(`/File/request/${request.id}/screenshot`);
            console.log('✅ Screenshot file data retrieved');
            return response.data;
          } catch (screenshotError) {
            console.error('❌ Error fetching screenshot:', screenshotError);
            // Continue searching in responses
          }
        }
      }

      // RequestResponse'larda ara
      console.log('📡 Fetching request responses...');
      const responsesResponse = await api.get('/RequestResponse');
      const responses = responsesResponse.data;
      console.log('📊 Found responses:', responses?.length || 0);
      
      for (const response of responses) {
        if (response.fileName === fileName || 
            response.filePath?.includes(fileName)) {
          console.log('📎 Found file in response:', response.id);
          try {
            const fileResponse = await api.get(`/File/response/${response.id}/file`);
            console.log('✅ Response file data retrieved');
            return fileResponse.data;
          } catch (responseError) {
            console.error('❌ Error fetching response file:', responseError);
            // Continue searching
          }
        }
      }

      console.log('❌ File not found in any request or response');
      
      // Son çare olarak, dosya adını içeren tüm alanları kontrol et
      console.log('🔍 Performing broader search...');
      try {
        // Tüm request'lerde daha geniş arama
        for (const request of requests) {
          const requestStr = JSON.stringify(request).toLowerCase();
          if (requestStr.includes(fileName.toLowerCase())) {
            console.log('🔍 Found file name in request data:', request.id);
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
            console.log('🔍 Found file name in response data:', response.id);
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
        console.error('❌ Error in broader search:', searchError);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching file by name:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
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
