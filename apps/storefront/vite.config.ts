import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Stores',
        short_name: 'QeSuite',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      workbox: {
        skipWaiting: true,       // activate new SW immediately, no second reload needed
        clientsClaim: true,      // take control of all open tabs instantly
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // No 'html': the document carries security headers that must always
        // come fresh from the network, never a response frozen at whatever
        // the headers were when the SW last installed.
        globPatterns: ['**/*.{js,css,ico,png,svg}'],
        // Never let the SW answer a navigation (page load/reload) from cache.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/products/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'products-cache',
              expiration: { maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
