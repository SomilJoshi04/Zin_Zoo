import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@food/api': path.resolve(__dirname, './src/services/api'),
      '@food': path.resolve(__dirname, './src/modules/Food'),
      '@delivery': path.resolve(__dirname, './src/modules/DeliveryV2'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui'
          if (id.includes('jspdf') || id.includes('qrcode') || id.includes('html2canvas')) return 'exports'
          if (id.includes('leaflet') || id.includes('@react-google-maps') || id.includes('@googlemaps')) return 'maps'
          if (id.includes('framer-motion') || id.includes('gsap')) return 'animation'
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor'
          return 'vendor'
        },
      },
    },
  },
})
