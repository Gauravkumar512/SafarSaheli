import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'SafarSaheli',
        short_name: 'SafarSaheli',
        description: 'Travel safety companion for women — PWA demo',
        theme_color: '#ec4899',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/home',
        icons: [
          { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
