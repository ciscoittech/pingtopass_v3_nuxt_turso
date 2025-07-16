/**
 * PingToPass Twitter Intelligence MCP Server
 * Simplified Cloudflare Worker for MCP endpoints
 */

interface Env {
  TURSO_DB_URL: string
  TURSO_DB_TOKEN: string
  OPENROUTER_API_KEY: string
  TWITTERAPI_IO_KEY: string
  ANALYTICS?: AnalyticsEngineDataset
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'PingToPass MCP Server'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // MCP tools endpoint
    if (url.pathname === '/tools') {
      const tools = [
        {
          name: 'analyze_competitor',
          description: 'Analyze a Twitter competitor using AI',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Twitter username to analyze (without @)' },
              include_recommendations: { type: 'boolean', description: 'Whether to include AI-generated recommendations', default: true }
            },
            required: ['username']
          }
        },
        {
          name: 'get_competitor_insights',
          description: 'Retrieve previously analyzed competitor insights from the database',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of insights to retrieve', default: 10 },
              confidence_threshold: { type: 'number', description: 'Minimum confidence score for insights', default: 0.7 }
            }
          }
        },
        {
          name: 'get_trending_topics',
          description: 'Get trending topics related to IT certifications and cloud technologies',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category (aws, azure, google, devops, etc.)', enum: ['aws', 'azure', 'google', 'devops', 'kubernetes', 'docker', 'python', 'javascript'] }
            }
          }
        },
        {
          name: 'deploy_to_cloudflare',
          description: 'Deploy the PingToPass application to Cloudflare Pages',
          inputSchema: {
            type: 'object',
            properties: {
              environment: { type: 'string', description: 'Target environment', enum: ['staging', 'production'], default: 'staging' },
              force: { type: 'boolean', description: 'Force deployment even if no changes detected', default: false }
            }
          }
        }
      ]

      return new Response(JSON.stringify({ tools }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Default response
    return new Response(JSON.stringify({ 
      message: 'PingToPass MCP Server', 
      version: '1.0.0',
      endpoints: ['/health', '/tools']
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}