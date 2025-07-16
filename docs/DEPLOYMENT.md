# 🚀 Deployment Guide

## Overview

This guide covers deploying PingToPass to Cloudflare Pages with NuxtHub integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Cloudflare Configuration](#cloudflare-configuration)
4. [Database Setup](#database-setup)
5. [Build & Deploy](#build--deploy)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

1. **Cloudflare Account**
   - Free tier is sufficient for starting
   - Upgrade to Pro for advanced features

2. **Turso Database**
   - Existing database (no migration needed)
   - Connection credentials ready

3. **Google OAuth**
   - OAuth 2.0 credentials configured
   - Redirect URIs updated

4. **OpenRouter API** (for AI features)
   - API key for question generation

### Local Requirements

```bash
# Node.js 18+ required
node --version  # Should be >= 18.0.0

# Install NuxtHub CLI
npm install -g @nuxthub/cli
```

## Environment Setup

### 1. Create Environment Files

```bash
# Production environment
cp .env.example .env.production
```

### 2. Configure Environment Variables

**.env.production:**
```env
# App Configuration
APP_NAME="PingToPass"
BASE_URL="https://pingtopass.com"

# Database (Turso)
TURSO_DB_URL="libsql://your-database.turso.io"
TURSO_DB_TOKEN="your-auth-token"

# Authentication
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# APIs
OPENROUTER_API_KEY="your-openrouter-key"
TWITTERAPI_IO_KEY="your-twitter-api-key"
RESEND_API_TOKEN="your-resend-token"

# Cloudflare
CF_PAGES_URL="https://pingtopass.pages.dev"
```

### 3. Generate Secure Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate session encryption key
openssl rand -hex 32
```

## Cloudflare Configuration

### 1. Create Cloudflare Pages Project

```bash
# Login to Cloudflare
nuxthub login

# Deploy to Cloudflare Pages
nuxthub deploy
```

### 2. Configure Build Settings

In Cloudflare Dashboard:

- **Build command**: `npm run build`
- **Build output directory**: `.output/public`
- **Environment variables**: Add all from .env.production

### 3. Configure Custom Domain

1. Go to Pages > Your Project > Custom domains
2. Add `pingtopass.com` and `www.pingtopass.com`
3. Configure DNS records:

```
Type    Name    Value                       Proxy
CNAME   @       pingtopass.pages.dev       ✓
CNAME   www     pingtopass.pages.dev       ✓
```

### 4. Enable Features

- **Web Analytics**: Settings > Analytics
- **Page Rules**: For caching optimization
- **Workers**: Automatically configured by NuxtHub

## Database Setup

### 1. Verify Turso Connection

```bash
# Test connection locally
npm run dev

# Check logs for successful connection
# ✅ Database connected successfully
```

### 2. No Migration Needed

Since we're using the existing Turso database:
- All data is preserved
- No schema changes required
- Just update connection strings

### 3. Configure Edge Locations

In Turso dashboard:
- Enable edge replicas near Cloudflare PoPs
- Recommended: US East, US West, EU Central

## Build & Deploy

### 1. Local Build Test

```bash
# Build for production
npm run build

# Test production build
npm run preview
```

### 2. Deploy via GitHub

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: pingtopass
          directory: .output/public
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Manual Deploy

```bash
# Deploy directly
nuxthub deploy --production

# Deploy with specific environment
nuxthub deploy --env production
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check deployment status
curl -I https://pingtopass.com

# Test key endpoints
curl https://pingtopass.com/api/health
```

### 2. Update OAuth Redirect URIs

In Google Cloud Console:
- Add `https://pingtopass.com/auth/oauth/google`
- Add `https://www.pingtopass.com/auth/oauth/google`

### 3. Configure Security Headers

**wrangler.toml additions:**
```toml
[env.production.routes]
  # Security headers
  { pattern = "/*", headers = {
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
    "Referrer-Policy" = "strict-origin-when-cross-origin"
    "Permissions-Policy" = "geolocation=(), microphone=(), camera=()"
  }}
```

### 4. Set Up Monitoring

1. **Cloudflare Analytics**
   - Enable Web Analytics
   - Configure custom events

2. **Error Tracking**
   ```typescript
   // plugins/error-tracking.client.ts
   export default defineNuxtPlugin((nuxtApp) => {
     nuxtApp.hook('vue:error', (error) => {
       // Send to monitoring service
       console.error('Vue error:', error)
     })
   })
   ```

## Monitoring

### 1. Cloudflare Analytics

Access via dashboard:
- **Traffic Analytics**: Visitor data
- **Performance**: Core Web Vitals
- **Security**: Threat detection

### 2. Custom Metrics

```typescript
// Send custom metrics
$fetch('/api/metrics', {
  method: 'POST',
  body: {
    metric: 'study_session_completed',
    value: 1,
    tags: { exam: 'AZ-900' }
  }
})
```

### 3. Health Checks

**api/health.get.ts:**
```typescript
export default defineEventHandler(async () => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    external: await checkExternalAPIs()
  }
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks
  }
})
```

### 4. Alerts

Configure in Cloudflare:
- Error rate > 1%
- Response time > 1000ms
- Success rate < 99%

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and rebuild
rm -rf .nuxt .output node_modules/.cache
npm install
npm run build
```

#### 2. Environment Variables Not Loading

- Verify in Cloudflare Pages settings
- Check for typos in variable names
- Ensure no quotes in Cloudflare UI

#### 3. Database Connection Issues

```typescript
// Add connection retry logic
const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await turso.connect()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

#### 4. OAuth Redirect Issues

- Verify redirect URIs match exactly
- Check for trailing slashes
- Ensure HTTPS is used

### Debug Mode

Enable debug logging:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    debug: process.env.DEBUG === 'true'
  }
})
```

### Performance Issues

1. **Check bundle size**
   ```bash
   npm run analyze
   ```

2. **Monitor edge function duration**
   - View in Cloudflare dashboard
   - Optimize long-running functions

3. **Cache configuration**
   ```typescript
   // Cache static assets
   routeRules: {
     '/images/**': { headers: { 'cache-control': 'max-age=31536000' } },
     '/api/**': { cors: true }
   }
   ```

## Production Checklist

- [ ] Environment variables configured
- [ ] OAuth redirect URIs updated
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Security headers configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Health checks passing
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## Rollback Strategy

### Quick Rollback

```bash
# Via Cloudflare Dashboard
# Pages > Project > Deployments > Previous deployment > Rollback

# Via CLI
nuxthub rollback --deployment-id abc123
```

### Database Rollback

Since Turso maintains automatic backups:
1. Access Turso dashboard
2. Navigate to backups
3. Restore to point in time

## Scaling Considerations

### Cloudflare Limits (Free Tier)

- 100,000 requests/day
- 500 builds/month
- 100GB bandwidth/month

### Upgrade Path

1. **Pro Plan** ($20/month)
   - 3M requests/month
   - Advanced analytics
   - Custom headers

2. **Business Plan**
   - Unlimited requests
   - Advanced security
   - Priority support

## Security Best Practices

1. **API Keys**
   - Rotate regularly
   - Use least privilege
   - Monitor usage

2. **Session Security**
   - Secure cookies only
   - HttpOnly flag enabled
   - SameSite strict

3. **Rate Limiting**
   - Configure in Cloudflare
   - Implement application-level limits

4. **Content Security Policy**
   ```typescript
   'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
   ```