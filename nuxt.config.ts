import { createResolver } from "@nuxt/kit";
import vuetify from "vite-plugin-vuetify";

const { resolve } = createResolver(import.meta.url);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Disable server-side rendering
  ssr: false,
  
  // Cloudflare Pages deployment
  nitro: {
    preset: 'cloudflare-pages',
    output: {
      dir: '.output',
      publicDir: '.output/public'
    }
  },
  
  // Experimental features for performance
  experimental: {
    componentIslands: false,
    payloadExtraction: true, // Enable for better performance
    treeshakeClientOnly: true, // Remove client-only components from server bundle
    asyncContext: true, // Better async handling
    defaults: {
      nuxtLink: {
        prefetch: true, // Enable link prefetching
        prefetchedClass: 'nuxt-link-prefetched',
      },
    },
  },

  // TypeScript configuration
  typescript: {
    shim: false,
  },

  css: [
    'vuetify/styles',
    '~/assets/scss/style.scss',
    '~/assets/css/global.css'
  ],

  // Vuetify build configuration
  build: {
    transpile: ["vuetify"],
  },

  // Vite configuration
  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
    build: {
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Optimize chunk size
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            'vuetify': ['vuetify'],
            'charts': ['apexcharts', 'vue3-apexcharts'],
            'icons': ['@iconify/vue'],
            'utils': ['lodash-es'], // 'dayjs' removed until needed
          },
          // Use content hash for better caching
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`
            } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
              return `fonts/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'vuetify',
        '@iconify/vue',
        'apexcharts',
        'vue3-apexcharts',
      ],
      exclude: ['@libsql/client'],
    },
  },

  // Vuetify module hook
  hooks: {
    'vite:extendConfig': (config) => {
      config.plugins?.push(
        vuetify({
          autoImport: true,
        })
      )
    }
  },

  // Modules
  modules: [
    "@pinia/nuxt",
    "nuxt-auth-utils",
    "@vite-pwa/nuxt",
    "@nuxthub/core", // Enable for Cloudflare deployment
  ],

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20,
    },
    manifest: {
      name: 'PingToPass - IT Certification Prep',
      short_name: 'PingToPass',
      description: 'Master IT certifications with AI-powered study tools',
      theme_color: '#1976d2',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      categories: ['education', 'productivity'],
      shortcuts: [
        {
          name: 'Study Mode',
          short_name: 'Study',
          description: 'Start studying immediately',
          url: '/study',
          icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Practice Test',
          short_name: 'Test',
          description: 'Take a practice test',
          url: '/test',
          icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
        }
      ]
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },

  // Application metadata
  app: {
    head: {
      title: "PingToPass - IT Certification Exam Preparation Platform",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Prepare for IT certification exams with comprehensive study tools and practice tests' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-tap-highlight', content: 'no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'PingToPass' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
      ]
    },
  },

  // Render optimizations
  render: {
    bundleRenderer: {
      shouldPreload: (file, type) => {
        // Preload critical assets
        if (type === 'script' || type === 'style') {
          return true
        }
        if (type === 'font') {
          return /\.woff2$/.test(file)
        }
        return false
      }
    }
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-side only)
    tursoDbUrl: process.env.TURSO_DB_URL,
    tursoDbToken: process.env.TURSO_DB_TOKEN,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    twitterApiKey: process.env.TWITTERAPI_IO_KEY,
    resendApiToken: process.env.RESEND_API_TOKEN,
    
    // Public keys (exposed to client)
    public: {
      appName: process.env.APP_NAME || 'PingToPass',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    }
  },

  // Auth configuration
  auth: {
    redirectOptions: {
      login: '/auth/login',
      logout: '/',
      callback: '/auth/oauth/google',
      home: '/dashboard'
    }
  },

  // NuxtHub configuration for Cloudflare
  hub: {
    // We're using Turso for database, so disable Cloudflare D1
    database: false,
    // Enable KV for session storage
    kv: true,
    // Enable blob storage for file uploads
    blob: true,
    // Enable cache for performance
    cache: true,
    // Enable analytics
    analytics: true
  },


  // Nitro configuration
  nitro: {
    preset: 'cloudflare-pages'
  },

  // Dev server configuration
  devServer: {
    port: 3000,
    host: 'localhost'
  },

  compatibilityDate: "2024-09-06",
});
