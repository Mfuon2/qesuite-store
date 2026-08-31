import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // Precaches the built app shell so the dashboard (and specifically POS,
    // the only surface with real offline data behavior — see src/offline/)
    // can launch with no network at all. Registration itself doesn't depend
    // on which route the tab is on; it's the shell, not the data, that's
    // cached here.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Stores',
        short_name: 'QeSuite',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        // TODO: dedicated 192x192/512x512 icon exports — reusing the
        // existing touch icon as a placeholder in the meantime.
        icons: [
          { src: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      }
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    }
  }
})
