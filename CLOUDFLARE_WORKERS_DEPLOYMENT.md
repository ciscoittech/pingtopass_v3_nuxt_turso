# Cloudflare Workers Deployment Guide

## Prerequisites
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Logged in to Wrangler (`wrangler login`)

## Configuration

### 1. Nuxt Configuration
Ensure your `nuxt.config.ts` has the correct preset:

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare'
  }
})
```

### 2. Wrangler Configuration
The `wrangler.toml` file is configured with:
- Main entry point: `.output/server/index.mjs`
- Static assets: `.output/public`
- Node.js compatibility flag

## Deployment Steps

### Step 1: Build the Project
```bash
pnpm run build
```

### Step 2: Set Secrets
Before deploying, set your secrets using Wrangler:

```bash
# Set each secret individually
wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_ID
wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_SECRET
wrangler secret put NUXT_SESSION_PASSWORD
wrangler secret put TURSO_DB_URL
wrangler secret put TURSO_DB_TOKEN
wrangler secret put OPENROUTER_API_KEY
wrangler secret put LANGCHAIN_API_KEY
wrangler secret put LANGCHAIN_TRACING_V2
wrangler secret put LANGCHAIN_PROJECT
```

### Step 3: Deploy
```bash
wrangler deploy
```

## Alternative: Deploy via Cloudflare Dashboard

1. Build locally: `pnpm run build`
2. Upload to Cloudflare Workers:
   - Go to Cloudflare Dashboard > Workers & Pages
   - Create new Worker
   - Upload `.output` directory
   - Configure environment variables

## Post-Deployment

### Update OAuth Redirect URLs
After deployment, update your Google OAuth settings:
- Redirect URL: `https://pingtopass-nuxt.{your-subdomain}.workers.dev/auth/oauth/google`

### Verify Deployment
1. Check worker URL in Cloudflare dashboard
2. Test authentication flow
3. Verify database connectivity
4. Test AI generation features

## Troubleshooting

### Common Issues

1. **"No entrypoint found"**
   - Ensure you ran `pnpm run build` before deploying
   - Check that `.output/server/index.mjs` exists

2. **Authentication errors**
   - Verify all secrets are set correctly
   - Check OAuth redirect URLs match your worker URL

3. **Database connection issues**
   - Ensure TURSO_DB_URL and TURSO_DB_TOKEN are set
   - Verify Turso database is accessible

### Debug Commands
```bash
# Check deployment status
wrangler tail

# View real-time logs
wrangler tail --format pretty

# List secrets (names only)
wrangler secret list
```

## Using with NuxtHub

If you're using @nuxthub/core features:

1. Create required Cloudflare resources:
   - KV namespaces
   - R2 buckets
   - D1 databases

2. Add bindings to wrangler.toml:
```toml
[[kv_namespaces]]
binding = "KV"
id = "your_kv_id"

[[r2_buckets]]
binding = "BLOB"
bucket_name = "your_bucket"
```

3. Use the NuxtHub CLI for easier management:
```bash
npx nuxthub deploy
```