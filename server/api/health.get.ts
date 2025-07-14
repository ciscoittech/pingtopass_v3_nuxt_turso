import { sql } from 'drizzle-orm'
import { users } from '../database/schema'
import { getHealthStatus, getAllMetrics } from '~/server/utils/monitoring'

export default defineEventHandler(async (event) => {
  try {
    // Basic health check
    const startTime = Date.now()
    
    // Check database connectivity
    const db = useDatabase()
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users).limit(1)
    
    const dbResponseTime = Date.now() - startTime
    
    // Get detailed health status from monitoring service
    const healthStatus = getHealthStatus()
    const metrics = getAllMetrics()
    
    // Determine overall health
    const allHealthy = Object.values(healthStatus).every(
      service => service.status === 'healthy'
    )
    
    const overallStatus = allHealthy && dbResponseTime < 1000 ? 'healthy' : 'degraded'
    
    // Basic system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.CF_REGION || 'unknown'
    }
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
          responseTime: dbResponseTime,
          lastCheck: new Date().toISOString(),
          userCount: result?.[0]?.count || 0
        },
        ...healthStatus
      },
      system: systemInfo,
      metrics: metrics,
      checks: {
        database_connectivity: dbResponseTime < 1000,
        memory_usage: process.memoryUsage ? process.memoryUsage().heapUsed < 100 * 1024 * 1024 : true, // < 100MB
        response_time: dbResponseTime < 2000,
        services_healthy: allHealthy
      }
    }
    
    // Set appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    setResponseStatus(event, statusCode)
    
    return {
      success: true,
      data: healthData
    }
    
  } catch (error: any) {
    console.error('Health check failed:', error)
    
    setResponseStatus(event, 503)
    
    return {
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed',
      services: {
        database: {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      }
    }
  }
})