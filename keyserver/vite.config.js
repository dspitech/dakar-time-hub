import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/videos': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/upload': 'http://localhost:8080',
      '/keys': 'http://localhost:8080',
      '/hls': 'http://localhost:8080',
      '/healthz': 'http://localhost:8080'
    }
  }
});
