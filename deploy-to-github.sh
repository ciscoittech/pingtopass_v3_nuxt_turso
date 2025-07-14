#!/bin/bash

# 🚀 PingToPass GitHub Deployment Script
# This script will create the GitHub repository and push your code

echo "🔐 First, authenticate with GitHub CLI..."
echo "Please follow the prompts to authenticate:"
gh auth login

echo ""
echo "✅ Authentication complete!"
echo ""
echo "📦 Creating GitHub repository..."

# Create the repository
gh repo create pingtopass-nuxt \
  --public \
  --description "PingToPass - IT Certification Exam Preparation Platform built with Nuxt.js and Cloudflare" \
  --homepage "https://pingtopass.com" \
  --clone=false

echo ""
echo "🔗 Adding GitHub remote..."
# Add the remote origin
git remote add origin https://github.com/$(gh api user --jq .login)/pingtopass-nuxt.git

echo ""
echo "📤 Pushing code to GitHub..."
# Push to GitHub
git push -u origin main

echo ""
echo "🎉 SUCCESS! Your code is now on GitHub!"
echo ""
echo "📍 Repository URL: https://github.com/$(gh api user --jq .login)/pingtopass-nuxt"
echo ""
echo "🚀 Next Steps:"
echo "1. Visit your NuxtHub dashboard: https://admin.hub.nuxt.com/ciscoittech"
echo "2. Connect this GitHub repository to your NuxtHub project"
echo "3. Configure environment variables as documented in DEPLOYMENT_CHECKLIST.md"
echo "4. Deploy to Cloudflare Pages!"
echo ""
echo "📚 Documentation:"
echo "- Deployment Guide: docs/DEPLOYMENT_GUIDE.md"
echo "- Deployment Checklist: docs/DEPLOYMENT_CHECKLIST.md"