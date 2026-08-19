import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  hooks: {
    // Vite 7 + @vitejs/plugin-vue 6 look for a sibling tsconfig.app.json next to the resolved
    // tsconfig.json when parsing <script setup> macros; Nuxt 3's typegen only writes tsconfig.json
    // + tsconfig.server.json, so we mirror the generated config to avoid an ENOENT crash on dev boot.
    'prepare:types': ({ tsConfig }) => {
      const buildDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '.nuxt')
      mkdirSync(buildDir, { recursive: true })
      writeFileSync(resolve(buildDir, 'tsconfig.app.json'), JSON.stringify(tsConfig, null, 2))
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/fonts',
    '@vite-pwa/nuxt'
  ],

  css: ['~/assets/css/tailwind.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant', class: 'dark' },
      title: 'WHONEXT UNIVERSE',
      meta: [
        { name: 'theme-color', content: '#0A0A0B' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // 'mock' (default) needs no external services. 'live' wires @line/liff + Supabase — see .env.example
      authMode: 'mock',
      liffId: '',
      supabaseUrl: '',
      supabaseAnonKey: ''
    }
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'Noto Sans TC', provider: 'google', weights: [400, 500, 600, 700, 800] }
    ]
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'WHONEXT UNIVERSE',
      short_name: 'WHONEXT',
      description: '運動賽事報名與現場核銷平台',
      theme_color: '#0A0A0B',
      background_color: '#0A0A0B',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages-cache' }
        },
        {
          urlPattern: ({ request }) => ['image'].includes(request.destination),
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
