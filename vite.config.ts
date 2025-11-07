/**
 * Vite Configuration
 *
 * Configures Vite build tool with React, PWA support, and path aliases.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ITAM PWA - IT Asset Management',
        short_name: 'ITAM',
        description: 'Progressive Web App for IT Asset Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#DC2626',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/screenshots/mobile.png',
            sizes: '640x1136',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
      },
      workbox: {
        // Cache configuration
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
  },
});
