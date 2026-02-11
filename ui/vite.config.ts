import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'http://66.45.227.158:17777',
        ws: true,
      },
      '/health': 'http://66.45.227.158:17777',
      '/messages': 'http://66.45.227.158:17777',
      '/send': 'http://66.45.227.158:17777',
      '/krew': 'http://66.45.227.158:17777',
    },
  },
})
