#!/bin/bash

echo "🚀 Deploying to NuxtHub..."

# Build the project first
echo "📦 Building project..."
pnpm run build

# Deploy to NuxtHub
echo "☁️  Deploying to Cloudflare..."
npx nuxthub deploy

echo "✅ Deployment complete!"
echo "Visit https://admin.hub.nuxt.com to manage your deployment"