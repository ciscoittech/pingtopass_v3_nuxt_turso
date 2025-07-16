#!/bin/bash

# PingToPass Cloudflare MCP Setup Script
# This script helps configure Cloudflare credentials for the MCP server

echo "🚀 PingToPass Cloudflare MCP Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please make sure you're in the project root directory."
    exit 1
fi

echo "📋 Current MCP Configuration:"
claude mcp list
echo ""

echo "🔑 Setting up Cloudflare credentials..."
echo ""

# Function to update .env file
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=".env"
    
    if grep -q "^${var_name}=" "$env_file"; then
        # Variable exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i "" "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
        else
            # Linux
            sed -i "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
        fi
        echo "✅ Updated ${var_name}"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=${var_value}" >> "$env_file"
        echo "✅ Added ${var_name}"
    fi
}

# Get Cloudflare API Token
echo "Please enter your Cloudflare API Token:"
echo "(Get it from: https://dash.cloudflare.com/profile/api-tokens)"
echo "Required permissions: Zone:Zone:Read, Zone:Page Rules:Edit, Account:Cloudflare Workers:Edit, Account:Account Settings:Read"
read -s -p "API Token: " CLOUDFLARE_API_TOKEN
echo ""

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ API Token cannot be empty"
    exit 1
fi

# Get Cloudflare Account ID
echo ""
echo "Please enter your Cloudflare Account ID:"
echo "(Found in the right sidebar of your Cloudflare dashboard)"
read -p "Account ID: " CLOUDFLARE_ACCOUNT_ID

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Account ID cannot be empty"
    exit 1
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."
update_env_var "CLOUDFLARE_API_TOKEN" "$CLOUDFLARE_API_TOKEN"
update_env_var "CLOUDFLARE_ACCOUNT_ID" "$CLOUDFLARE_ACCOUNT_ID"

# Test the configuration
echo ""
echo "🧪 Testing Cloudflare authentication..."
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Test authentication
if wrangler whoami &> /dev/null; then
    echo "✅ Cloudflare authentication successful!"
    wrangler whoami
else
    echo "❌ Cloudflare authentication failed. Please check your credentials."
    exit 1
fi

echo ""
echo "🎉 Cloudflare MCP Server setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Deploy the MCP worker: cd mcp-worker && wrangler deploy"
echo "2. Test MCP integration in Claude Code"
echo "3. Deploy your main application: wrangler deploy"
echo ""
echo "📖 Documentation: docs/MCP_SETUP.md"
echo "🔧 Test your setup: claude mcp get cloudflare-workers"