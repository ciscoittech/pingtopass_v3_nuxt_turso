# Cloudflare Pages Deployment Guide

## Build Configuration for Cloudflare Pages

When setting up your project in Cloudflare Pages dashboard, use these settings:

### Build Settings
- **Framework preset**: Nuxt.js
- **Build command**: `pnpm run build`
- **Build output directory**: `.output/public`
- **Root directory**: `/` (leave empty)
- **Environment variables**: `NODE_VERSION=20`

### Environment Variables to Add

In the Cloudflare Pages dashboard, add these environment variables:

```
# OAuth
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
TURSO_DB_URL=your_turso_database_url
TURSO_DB_TOKEN=your_turso_auth_token

# Session
NUXT_SESSION_PASSWORD=your_session_password

# APIs
OPENROUTER_API_KEY=your_openrouter_api_key
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_TRACING_V2=true
LANGSMITH_TRACING=true
LANGCHAIN_PROJECT=pingtopass

# App Config
NODE_ENV=production
```

## Deployment Steps

### Option 1: Through Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect to Git
4. Select your GitHub repository
5. Configure build settings as shown above
6. Add environment variables
7. Click "Save and Deploy"

### Option 2: Direct CLI Deployment

If you want to deploy manually:

```bash
# Build the project
pnpm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .output/public --project-name=pingtopass-nuxt
```

## Important Notes

### For Nuxt 3 on Cloudflare Pages

1. **Remove wrangler.toml**: You don't need it for Pages deployment
2. **Use nitro preset**: Make sure your nuxt.config.ts has the correct preset

Add this to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages'
  }
})
```

### Fix for Current Error

The error you're seeing is because Cloudflare is trying to deploy as a Worker instead of Pages. To fix:

1. **Don't use `wrangler deploy`** - that's for Workers
2. **Use `wrangler pages deploy`** instead
3. **Or better**: Use the Cloudflare Pages dashboard

## After Deployment

1. Update Google OAuth redirect URLs:
   - `https://pingtopass-nuxt.pages.dev/auth/oauth/google`
   - `https://your-custom-domain.com/auth/oauth/google`

2. Test all features:
   - Authentication
   - Database connectivity
   - AI generation
   - Study/Test modes

## Troubleshooting

If deployment fails:
1. Check build logs in Cloudflare dashboard
2. Ensure all environment variables are set
3. Verify `nitro.preset` is set to `cloudflare-pages`
4. Check that output directory is `.output/public`