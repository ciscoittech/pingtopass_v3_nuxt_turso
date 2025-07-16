# Cloudflare MCP Server Setup for PingToPass

This document explains the Model Context Protocol (MCP) integration with Cloudflare for the PingToPass Twitter Intelligence system.

## Overview

The Cloudflare MCP server enables direct interaction with Cloudflare services from Claude Code, allowing seamless deployment, monitoring, and management of the PingToPass application.

## Installation

The MCP server has been configured with the following components:

### 1. Package Installation
```bash
pnpm add -D workers-mcp
```

### 2. MCP Server Configuration
- **Local Config**: Added via `claude mcp add cloudflare-workers npx workers-mcp`
- **Project Config**: Defined in `.mcp.json` for team sharing
- **Environment**: Uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

## Configuration Files

### `.mcp.json` (Project-wide sharing)
```json
{
  "mcpServers": {
    "cloudflare-workers": {
      "command": "npx",
      "args": ["workers-mcp"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    }
  }
}
```

### Environment Variables (`.env`)
```bash
# Cloudflare API Configuration (for MCP server)
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
```

## MCP Worker Implementation

### Location: `mcp-worker/`
- **index.ts**: Main MCP server implementation
- **package.json**: Dependencies and scripts
- **wrangler.toml**: Cloudflare Worker configuration

### Available Tools

1. **analyze_competitor**
   - Analyze Twitter competitors using AI
   - Input: username, include_recommendations
   - Output: User data, metrics, insights

2. **get_competitor_insights**
   - Retrieve analyzed competitor insights
   - Input: limit, confidence_threshold
   - Output: Filtered insights with metadata

3. **get_trending_topics**
   - Get trending certification topics
   - Input: category filter
   - Output: Trending hashtags and opportunities

4. **deploy_to_cloudflare**
   - Deploy PingToPass to Cloudflare Pages
   - Input: environment, force flag
   - Output: Deployment status and URL

## Setup Instructions

### 1. Get Cloudflare Credentials

1. **API Token**: 
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Create Custom Token with:
     - Zone:Zone:Read
     - Zone:Page Rules:Edit
     - Account:Cloudflare Workers:Edit
     - Account:Account Settings:Read

2. **Account ID**:
   - Found in the right sidebar of your Cloudflare dashboard
   - Or via API: `curl -X GET "https://api.cloudflare.com/client/v4/accounts" -H "Authorization: Bearer YOUR_API_TOKEN"`

### 2. Update Environment Variables

Replace placeholders in `.env`:
```bash
CLOUDFLARE_API_TOKEN=your_actual_api_token
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id
```

### 3. Verify MCP Configuration

```bash
# List configured servers
claude mcp list

# Get server details
claude mcp get cloudflare-workers
```

## Usage Examples

Once configured, you can use Claude Code to:

### Deploy Application
```
Claude, deploy the PingToPass application to staging environment using the Cloudflare MCP server.
```

### Analyze Competitors
```
Claude, analyze the Twitter competitor @awscloudgirl and generate insights for our content strategy.
```

### Get Trending Topics
```
Claude, get the current trending topics in cloud certifications to identify content opportunities.
```

### Monitor Deployment
```
Claude, check the health status of our Cloudflare deployment and show recent analytics.
```

## Benefits

### Development Workflow
- **Direct Deployment**: Deploy from Claude Code without switching tools
- **Environment Management**: Switch between staging/production environments
- **Real-time Monitoring**: Access Cloudflare analytics and logs
- **Configuration Management**: Update environment variables and settings

### Twitter Intelligence Integration
- **Competitor Analysis**: Automated Twitter user analysis
- **Trend Monitoring**: Real-time trending topic identification
- **Content Strategy**: AI-powered content recommendations
- **Performance Tracking**: Analytics integration for insights

### Production Operations
- **Zero-downtime Deployment**: Seamless Cloudflare Pages deployment
- **Global CDN**: Leverage Cloudflare's 300+ edge locations
- **Performance Optimization**: Edge computing for Twitter analysis
- **Cost Monitoring**: Track usage and optimize costs

## File Structure

```
pingtopass-nuxt/
├── .mcp.json                 # Project MCP configuration
├── wrangler.toml            # Main app Cloudflare config
├── mcp-worker/              # MCP server implementation
│   ├── index.ts            # Worker with MCP tools
│   ├── package.json        # Worker dependencies
│   └── wrangler.toml       # Worker-specific config
└── docs/
    └── MCP_SETUP.md        # This documentation
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   ```bash
   claude mcp list  # Verify server is added
   ```

2. **Authentication Errors**
   - Verify API token has correct permissions
   - Check account ID is correct
   - Ensure environment variables are set

3. **Worker Deployment Fails**
   ```bash
   cd mcp-worker
   wrangler auth whoami  # Verify authentication
   wrangler deploy       # Test direct deployment
   ```

### Debug Commands

```bash
# Check MCP server status
claude mcp get cloudflare-workers

# Test environment variables
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID

# Verify Cloudflare authentication
npx wrangler whoami
```

## Next Steps

1. **Configure Real API Tokens**: Replace placeholder values with actual Cloudflare credentials
2. **Deploy MCP Worker**: Deploy the MCP server to Cloudflare Workers
3. **Test Integration**: Verify MCP tools work correctly with Claude Code
4. **Production Setup**: Configure production environment and custom domains

## Security Notes

- Keep API tokens secure and never commit them to version control
- Use environment-specific tokens for staging vs production
- Regularly rotate API tokens for security
- Monitor API usage and set up alerts for unusual activity

For more information, see:
- [Cloudflare Workers MCP Documentation](https://github.com/cloudflare/workers-mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [PingToPass Architecture Documentation](../docs/01-migration-overview.md)