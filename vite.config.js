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
      }
    }
  }
})
