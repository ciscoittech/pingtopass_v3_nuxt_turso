# NuxtHub Deployment Guide

## Quick Deployment Steps

Since the interactive CLI is causing issues, follow these steps to deploy via the NuxtHub web interface:

### 1. Visit NuxtHub Admin
Go to: https://admin.hub.nuxt.com

### 2. Sign In
- Sign in with your GitHub account
- Authorize NuxtHub to access your repositories

### 3. Create New Project
- Click "New Project" or "Import from GitHub"
- Select the repository: `pingtopass-nuxt`
- Choose branch: `main`

### 4. Configure Environment Variables
Add these secrets in the NuxtHub dashboard:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NUXT_SESSION_PASSWORD=your_secure_session_password_from_env_production
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
OPENROUTER_API_KEY=your_openrouter_api_key
LANGCHAIN_API_KEY=your_langchain_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
```

### 5. Deploy
- Click "Deploy" to start the deployment
- NuxtHub will automatically:
  - Build your Nuxt application
  - Deploy to Cloudflare's edge network
  - Provide you with a demo URL

### 6. After Deployment
1. **Update Google OAuth Redirect URLs**:
   - Go to Google Cloud Console
   - Add your new NuxtHub URL to authorized redirect URIs:
     - `https://your-project.nuxt.dev/auth/google`
     - `https://your-project.nuxt.dev/api/auth/callback/google`

2. **Test Your Application**:
   - Visit your demo URL
   - Test authentication
   - Verify database connectivity
   - Check AI generation features

## Alternative: Command Line Deployment

If you prefer command line after getting the project key:

```bash
# After linking via web UI, you'll get a NUXT_HUB_PROJECT_KEY
export NUXT_HUB_PROJECT_KEY=your_project_key

# Deploy
npx nuxthub deploy --build
```

## Troubleshooting

### If deployment fails:
1. Check build logs in NuxtHub dashboard
2. Verify all environment variables are set
3. Ensure wrangler.toml is minimal (already fixed)
4. Check that all dependencies are in package.json

### Common Issues:
- **Build errors**: Usually missing dependencies or TypeScript errors
- **Runtime errors**: Usually missing environment variables
- **Auth errors**: Update OAuth redirect URLs

## Production Deployment

Once tested on demo domain:
1. Add custom domain in NuxtHub dashboard
2. Update DNS records as instructed
3. Update all OAuth redirect URLs to production domain
4. Update BASE_URL in environment variables

## Support

- NuxtHub Docs: https://hub.nuxt.com/docs
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Discord: https://discord.gg/nuxt