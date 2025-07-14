#!/bin/bash

# Script to set up Cloudflare Workers secrets for production deployment
# This script helps configure all required environment variables and secrets

set -e

echo "🔐 PingToPass Secrets Configuration"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Check if authenticated
if ! wrangler whoami &> /dev/null; then
    log_error "Not authenticated with Cloudflare. Run: wrangler login"
    exit 1
fi

log_info "Setting up secrets for PingToPass..."

# Function to set secret with prompt
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    
    echo
    log_info "Setting up: $secret_name"
    echo "Description: $description"
    if [[ -n "$example" ]]; then
        echo "Example: $example"
    fi
    
    # Check if secret already exists
    if wrangler secret list | grep -q "$secret_name"; then
        log_warning "Secret $secret_name already exists"
        read -p "Do you want to update it? (y/N): " update_secret
        if [[ ! "$update_secret" =~ ^[Yy]$ ]]; then
            log_info "Skipping $secret_name"
            return
        fi
    fi
    
    read -p "Enter value for $secret_name (input hidden): " -s secret_value
    echo
    
    if [[ -z "$secret_value" ]]; then
        log_warning "Empty value provided, skipping $secret_name"
        return
    fi
    
    echo "$secret_value" | wrangler secret put "$secret_name"
    log_success "Secret $secret_name configured successfully"
}

# Google OAuth Configuration
echo "🔐 Google OAuth Setup"
echo "====================="
log_info "Set up Google OAuth at: https://console.developers.google.com/"
log_info "1. Create a new project or select existing"
log_info "2. Enable Google+ API"
log_info "3. Create OAuth 2.0 credentials"
log_info "4. Add authorized redirect URIs:"
log_info "   - https://pingtopass.com/api/auth/google"
log_info "   - https://pingtopass-nuxt.pages.dev/api/auth/google"

set_secret "GOOGLE_CLIENT_ID" "Google OAuth Client ID" "123456789-abcdef.apps.googleusercontent.com"
set_secret "GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret" "GOCSPX-abcdef123456..."

# Session Security
echo
echo "🔐 Session Security"
echo "=================="
log_info "Generate a secure session password (minimum 32 characters)"

set_secret "NUXT_SESSION_PASSWORD" "Session encryption password (32+ chars)" "super-secret-session-password-min-32-chars"

# Database Configuration
echo
echo "🗄️ Database Configuration"
echo "========================"
log_info "Get these values from your Turso dashboard: https://app.turso.tech/"

set_secret "TURSO_DATABASE_URL" "Turso database URL" "libsql://database-org.turso.io"
set_secret "TURSO_AUTH_TOKEN" "Turso authentication token" "eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQS..."

# AI Services
echo
echo "🤖 AI Services Configuration"
echo "=========================="
log_info "Get OpenRouter API key from: https://openrouter.ai/keys"

set_secret "OPENROUTER_API_KEY" "OpenRouter API key for AI services" "sk-or-v1-abcdef123456..."

# Twitter Integration
echo
echo "🐦 Twitter Integration"
echo "===================="
log_info "Get Twitter API key from: https://twitterapi.io/"

set_secret "TWITTER_API_KEY" "TwitterAPI.io API key" "twitter-api-key-from-twitterapi-io"

# Webhook Security
echo
echo "🔗 Webhook Security"
echo "=================="
log_info "Generate a secure webhook secret for external integrations"

set_secret "WEBHOOK_SECRET" "Webhook verification secret" "webhook-secret-for-external-integrations"

# Monitoring
echo
echo "📊 Monitoring Configuration"
echo "========================="
log_info "Generate a secret for monitoring system authentication"

set_secret "MONITORING_SECRET" "Monitoring system secret" "monitoring-auth-secret-key"

# Optional: Email Configuration (if implementing email notifications)
echo
echo "📧 Email Configuration (Optional)"
echo "================================"
log_warning "Email configuration is optional for MVP"
read -p "Do you want to set up email configuration? (y/N): " setup_email

if [[ "$setup_email" =~ ^[Yy]$ ]]; then
    set_secret "SMTP_HOST" "SMTP server hostname" "smtp.gmail.com"
    set_secret "SMTP_PORT" "SMTP server port" "587"
    set_secret "SMTP_USER" "SMTP username/email" "your-email@gmail.com"
    set_secret "SMTP_PASS" "SMTP password/app password" "your-app-password"
    set_secret "FROM_EMAIL" "Email sender address" "noreply@pingtopass.com"
fi

# Summary
echo
echo "📋 Configuration Summary"
echo "======================="

log_info "Checking configured secrets..."
CONFIGURED_SECRETS=(
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "NUXT_SESSION_PASSWORD"
    "TURSO_DATABASE_URL"
    "TURSO_AUTH_TOKEN"
    "OPENROUTER_API_KEY"
    "TWITTER_API_KEY"
    "WEBHOOK_SECRET"
    "MONITORING_SECRET"
)

MISSING_SECRETS=()

for secret in "${CONFIGURED_SECRETS[@]}"; do
    if wrangler secret list | grep -q "$secret"; then
        log_success "$secret configured"
    else
        log_error "$secret missing"
        MISSING_SECRETS+=("$secret")
    fi
done

echo
if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    log_success "🎉 All required secrets are configured!"
    echo
    log_info "Next steps:"
    echo "1. Run: ./scripts/deploy-production.sh"
    echo "2. Configure custom domain in Cloudflare dashboard"
    echo "3. Set up DNS records"
    echo "4. Test the deployment"
else
    log_warning "Missing secrets: ${MISSING_SECRETS[*]}"
    echo "Please run this script again or configure them manually with:"
    echo "wrangler secret put SECRET_NAME"
fi

echo
log_info "You can view all secrets with: wrangler secret list"
log_info "You can update any secret with: wrangler secret put SECRET_NAME"