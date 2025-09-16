import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7097',
        changeOrigin: true,
        secure: false, // HTTPS sertifika doğrulamasını atla
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/messageHub': {
        target: 'https://localhost:7097',
        changeOrigin: true,
        secure: false, // HTTPS sertifika doğrulamasını atla
        ws: true, // WebSocket proxy için gerekli
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('SignalR proxy error:', err);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            console.log('SignalR WebSocket proxy request:', req.url);
          });
        }
      }
    }
  }
})
