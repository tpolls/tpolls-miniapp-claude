import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '7879-2400-4050-9d61-8700-ed2b-2cad-6971-caa1.ngrok-free.app'],
  },
})