import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo512.png'],
      manifest: {
        name: 'CodeXyra Trading',
        short_name: 'CX Trading',
        description: 'Mandi Crop Transaction Platform',
        theme_color: '#15803d',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [{ src: 'logo512.png', sizes: '512x512', type: 'image/png' }]
      }
    })
  ]
})