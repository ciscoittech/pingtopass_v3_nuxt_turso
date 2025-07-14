# 🚀 PingToPass Cloudflare Deployment Guide

**Last Updated:** 2025-01-14  
**Sprint:** Sprint 8 - Theme Migration & Deployment

## 📋 Prerequisites

Before deploying to Cloudflare, ensure you have:

1. **Cloudflare Account** with Pages enabled
2. **GitHub Repository** for the project
3. **Turso Database** already set up and populated
4. **Google OAuth** credentials configured
5. **OpenRouter API** key for AI features
6. **Domain** configured in Cloudflare DNS

## 🔧 Setup Steps

### 1. Cloudflare Pages Setup

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub repository
4. Configure build settings:
   ```
   Framework preset: Nuxt.js
   Build command: pnpm run build
   Build output directory: .output/public
   Node version: 20
   ```

### 2. Environment Variables

In Cloudflare Pages settings, add these environment variables:

```bash
# Database
TURSO_DB_URL=libsql://your-database.turso.io
TURSO_DB_TOKEN=your-turso-auth-token

# Authentication
NUXT_SESSION_PASSWORD=your-32-character-session-password
NUXT_OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
OPENROUTER_API_KEY=sk-or-v1-your-key

# Optional Services
RESEND_API_TOKEN=re_your-token
TWITTERAPI_IO_KEY=your-twitter-key

# Application
APP_NAME=PingToPass
BASE_URL=https://pingtopass.com
```

### 3. NuxtHub Setup (Alternative Method)

1. Visit [hub.nuxt.com](https://hub.nuxt.com)
2. Create a new project
3. Link your GitHub repository
4. Run locally:
   ```bash
   npx nuxthub link
   npx nuxthub deploy
   ```

### 4. GitHub Actions Secrets

Add these secrets in your GitHub repository settings:

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ZONE_ID
NUXT_HUB_PROJECT_KEY (optional)
NUXT_HUB_USER_TOKEN (optional)
```

### 5. Domain Configuration

1. In Cloudflare Pages → Custom domains
2. Add `pingtopass.com` and `www.pingtopass.com`
3. Configure DNS records (automatic with Cloudflare DNS)

## 🚀 Deployment Process

### Manual Deployment

```bash
# Install dependencies
pnpm install

# Build for production
pnpm run build

# Deploy with Wrangler
npx wrangler pages deploy .output/public --project-name=pingtopass-nuxt

# Or deploy with NuxtHub
npx nuxthub deploy
```

### Automatic Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

## 🔍 Verification Steps

### 1. Check Deployment Status
- Cloudflare Dashboard → Pages → Your project
- GitHub Actions tab in your repository

### 2. Test Core Features
- [ ] Google OAuth login works
- [ ] Database connections are stable
- [ ] Study mode loads questions
- [ ] Test mode timer functions
- [ ] PWA installation prompt appears
- [ ] Theme switching works

### 3. Monitor Performance
- Cloudflare Analytics → Web Analytics
- Check Core Web Vitals
- Monitor error rates

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .nuxt .output node_modules
   pnpm install
   pnpm run build
   ```

2. **Environment Variable Issues**
   - Verify all variables are set in Cloudflare
   - Check for typos in variable names
   - Ensure no trailing spaces in values

3. **Database Connection Errors**
   - Verify Turso URL includes protocol: `libsql://`
   - Check auth token is valid
   - Test connection locally first

4. **OAuth Redirect Issues**
   - Update Google OAuth authorized redirect URIs
   - Include both `https://pingtopass.com` and `https://www.pingtopass.com`

### Debug Commands

```bash
# Test build locally
pnpm run build
pnpm run preview

# Check for TypeScript errors
pnpm run typecheck

# Verify environment variables
npx nuxi info
```

## 📊 Post-Deployment

### 1. Analytics Setup
- Enable Cloudflare Web Analytics
- Configure Real User Monitoring (RUM)
- Set up custom events tracking

### 2. Performance Optimization
- Enable Auto Minify in Cloudflare
- Configure Page Rules for caching
- Set up Argo Smart Routing (optional)

### 3. Security Headers
Already configured in `wrangler.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### 4. Monitoring
- Set up Cloudflare Email Alerts
- Configure uptime monitoring
- Enable error reporting

## 🔄 Rollback Procedure

If issues arise:

1. **Via Cloudflare Dashboard**
   - Pages → Your project → Deployments
   - Click "Rollback" on previous deployment

2. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   ```

## 📝 Maintenance

### Regular Tasks
- Monitor error logs weekly
- Review analytics monthly
- Update dependencies quarterly
- Rotate API keys annually

### Backup Strategy
- Database: Turso handles automatic backups
- Code: GitHub repository
- Secrets: Store securely in password manager

## 🎯 Success Metrics

Post-deployment targets:
- **Performance**: <100ms response time globally
- **Uptime**: 99.9% availability
- **Core Web Vitals**: All green
- **Error Rate**: <1%

## 📞 Support

For deployment issues:
- Cloudflare Support: [support.cloudflare.com](https://support.cloudflare.com)
- NuxtHub Discord: [discord.gg/nuxt](https://discord.gg/nuxt)
- GitHub Issues: Project repository

---

**Remember:** Always test in a preview deployment before pushing to production!