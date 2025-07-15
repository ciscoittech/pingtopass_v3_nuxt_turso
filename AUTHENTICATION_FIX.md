# NuxtHub Authentication Fix

## The Issue
You're getting a 401 Authentication error because NuxtHub CLI needs authentication, but the CLI login doesn't work in headless/terminal mode.

## Solution: Use NuxtHub Token

### Step 1: Get Your NuxtHub Token
1. Go to https://admin.hub.nuxt.com
2. Sign in with your GitHub account
3. Go to your account settings or tokens section
4. Generate a new API token (or use existing one)

### Step 2: Set the Token
Add the token to your environment:

```bash
# Option 1: Export for current session
export NUXT_HUB_USER_TOKEN=your_token_here

# Option 2: Add to .env.local (for development)
echo "NUXT_HUB_USER_TOKEN=your_token_here" >> .env.local
```

### Step 3: Deploy with Token
Now you can deploy:

```bash
# With token set, deploy directly
npx nuxthub deploy --build
```

## Alternative: Use GitHub Actions

If you can't get the token method working, set up automated deployment:

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to NuxtHub
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Deploy to NuxtHub
        run: npx nuxthub deploy --build
        env:
          NUXT_HUB_USER_TOKEN: ${{ secrets.NUXT_HUB_USER_TOKEN }}
```

2. Add the `NUXT_HUB_USER_TOKEN` to your GitHub repository secrets

## Quick Fix: Use Web Interface

Since you're already in the terminal and getting auth errors, the fastest solution is:

1. **Push your current changes to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for NuxtHub deployment"
   git push origin main
   ```

2. **Use NuxtHub Web Interface**:
   - Go to https://admin.hub.nuxt.com
   - Click "New Project" or "Import"
   - Select your GitHub repository
   - NuxtHub will handle authentication automatically
   - Add your environment variables from `.env.production`
   - Deploy!

## Environment Variables to Add in NuxtHub Dashboard

Copy these from your `.env.production` file:

```
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
TURSO_DB_URL=your_turso_database_url
TURSO_DB_TOKEN=your_turso_auth_token
NUXT_SESSION_PASSWORD=your_session_password
OPENROUTER_API_KEY=your_openrouter_api_key
LANGCHAIN_API_KEY=your_langchain_api_key
```

**Important**: Use the actual values from your `.env.production` file, not the placeholders above!

## After Successful Deployment

Update Google OAuth redirect URLs to your actual deployment URL:
- `https://your-actual-url.nuxt.dev/auth/oauth/google`

---

**Note**: The web interface is the most reliable method for first-time deployment!