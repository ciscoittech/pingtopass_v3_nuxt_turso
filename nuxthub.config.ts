export default defineNuxtHubConfig({
  // Cloudflare account ID (optional, can be set via dashboard)
  // accountId: 'your-cloudflare-account-id',
  
  // Project name on NuxtHub
  projectName: 'pingtopass',
  
  // Cloudflare Pages project name
  cloudflarePagesProject: 'pingtopass-nuxt',
  
  // Custom domain configuration
  domains: [
    'pingtopass.com',
    'www.pingtopass.com'
  ],
  
  // Environment variables to sync
  env: {
    // These will be encrypted and stored securely
    variables: [
      'TURSO_DB_URL',
      'TURSO_DB_TOKEN',
      'NUXT_SESSION_PASSWORD',
      'NUXT_OAUTH_GOOGLE_CLIENT_ID',
      'NUXT_OAUTH_GOOGLE_CLIENT_SECRET',
      'OPENROUTER_API_KEY',
      'RESEND_API_TOKEN',
      'TWITTERAPI_IO_KEY'
    ]
  },
  
  // Deployment settings
  deploymentSettings: {
    // Build command
    buildCommand: 'pnpm run build',
    
    // Node version
    nodeVersion: '20',
    
    // Install command
    installCommand: 'pnpm install',
    
    // Build output directory
    buildOutputDirectory: '.output/public'
  },
  
  // Cache configuration
  cache: {
    // Cache static assets for 1 year
    browserTTL: 31536000,
    
    // Edge cache for 1 hour
    edgeTTL: 3600,
    
    // Bypass cache for these paths
    bypassCache: [
      '/api/*',
      '/auth/*',
      '/_hub/*'
    ]
  },
  
  // Analytics configuration
  analytics: {
    // Enable Web Analytics
    webAnalytics: true,
    
    // Enable Real User Monitoring
    rum: true
  },
  
  // Security headers
  headers: {
    '/*': {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline';"
    }
  },
  
  // Redirects
  redirects: [
    {
      from: 'http://pingtopass.com/*',
      to: 'https://pingtopass.com/$1',
      status: 301
    },
    {
      from: 'http://www.pingtopass.com/*',
      to: 'https://pingtopass.com/$1',
      status: 301
    },
    {
      from: 'https://www.pingtopass.com/*',
      to: 'https://pingtopass.com/$1',
      status: 301
    }
  ]
})