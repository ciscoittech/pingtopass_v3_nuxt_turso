import { createResolver } from "@nuxt/kit";
import vuetify from "vite-plugin-vuetify";

const { resolve } = createResolver(import.meta.url);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Disable server-side rendering
  ssr: false,
  
  // Disable experimental features
  experimental: {
    componentIslands: false,
    payloadExtraction: false,
  },

  // TypeScript configuration
  typescript: {
    shim: false,
  },

  css: ['vuetify/styles'],

  // Vuetify build configuration
  build: {
    transpile: ["vuetify"],
  },

  // Vite configuration
  vite: {
    ssr: {
      noExternal: ['vuetify'],
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
    // "@nuxthub/core", // Disabled for now since we're using Turso
  ],

  // Application metadata
  app: {
    head: {
      title: "PingToPass - IT Certification Exam Preparation Platform",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Prepare for IT certification exams with comprehensive study tools and practice tests' }
      ],
    },
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

  // NuxtHub configuration for Cloudflare (disabled for now)
  // hub: {
  //   database: true,
  //   kv: true,
  //   blob: true,
  //   cache: true,
  // },


  // Nitro configuration
  nitro: {
    serveStatic: true,
    devProxy: {
      '/.well-known': { target: 'http://localhost:3000', changeOrigin: true }
    }
  },

  // Dev server configuration
  devServer: {
    port: 3000,
    host: 'localhost'
  },

  compatibilityDate: "2024-09-06",
});
