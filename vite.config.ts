import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/zoho-accounts': {
        target: 'https://accounts.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-accounts/, '')
      },
      '/zoho-mail': {
        target: 'https://mail.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-mail/, '')
      }
    }
  }
})
