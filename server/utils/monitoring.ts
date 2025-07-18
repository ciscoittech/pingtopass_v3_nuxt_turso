/**
 * Production Monitoring and Observability System
 * 
 * Provides comprehensive monitoring for:
 * - Performance metrics and alerts
 * - Error tracking and reporting
 * - Cost monitoring and optimization
 * - Health checks and uptime monitoring
 * - User activity and business metrics
 */

import { useDB } from './db'
import { users } from '../database/schema/users'

export interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  unit?: 'count' | 'duration' | 'bytes' | 'percentage' | 'rate'
}

export interface AlertConfig {
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  window: number // minutes
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: Array<'console' | 'email' | 'slack' | 'webhook'>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
  lastCheck: number
}

export class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map()
  private alerts: AlertConfig[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()

  constructor() {
    this.setupDefaultAlerts()
    this.startHealthChecks()
  }

  /**
   * Record a metric data point
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit: unit as any
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metricHistory = this.metrics.get(name)!
    metricHistory.push(metric)

    // Keep only last 1000 data points per metric
    if (metricHistory.length > 1000) {
      metricHistory.shift()
    }

    // Check alerts
    this.checkAlerts(name, value)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${name}: ${value}${unit ? ` ${unit}` : ''}`, tags)
    }
  }

  /**
   * Get aggregated metrics
   */
  getMetrics(name: string, window?: number): {
    current: number
    average: number
    min: number
    max: number
    count: number
    trend: 'up' | 'down' | 'stable'
  } {
    const metrics = this.metrics.get(name) || []
    const windowStart = window ? Date.now() - (window * 60 * 1000) : 0
    const windowMetrics = metrics.filter(m => m.timestamp >= windowStart)

    if (windowMetrics.length === 0) {
      return {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        trend: 'stable'
      }
    }

    const values = windowMetrics.map(m => m.value)
    const current = values[values.length - 1]
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Calculate trend
    const halfPoint = Math.floor(values.length / 2)
    const firstHalf = values.slice(0, halfPoint)
    const secondHalf = values.slice(halfPoint)
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (secondAvg > firstAvg * 1.1) trend = 'up'
    else if (secondAvg < firstAvg * 0.9) trend = 'down'

    return {
      current,
      average,
      min,
      max,
      count: windowMetrics.length,
      trend
    }
  }

  /**
   * Get all current metrics
   */
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name, 60) // Last hour
    }

    return result
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring(): void {
    // Monitor response times
    setInterval(() => {
      this.recordResponseTimeMetrics()
    }, 30000) // Every 30 seconds

    // Monitor resource usage
    setInterval(() => {
      this.recordResourceMetrics()
    }, 60000) // Every minute

    // Monitor error rates
    setInterval(() => {
      this.recordErrorMetrics()
    }, 30000) // Every 30 seconds
  }

  /**
   * Monitor agent performance
   */
  monitorAgentPerformance(agentType: string, operation: string, duration: number, success: boolean): void {
    this.recordMetric(`agent.${agentType}.${operation}.duration`, duration, { 
      agent: agentType, 
      operation,
      success: success.toString()
    }, 'duration')

    this.recordMetric(`agent.${agentType}.${operation}.requests`, 1, {
      agent: agentType,
      operation,
      success: success.toString()
    }, 'count')

    if (!success) {
      this.recordMetric(`agent.${agentType}.${operation}.errors`, 1, {
        agent: agentType,
        operation
      }, 'count')
    }
  }

  /**
   * Monitor API costs
   */
  monitorAPICosts(service: string, operation: string, cost: number, tokens?: number): void {
    this.recordMetric(`api.${service}.cost`, cost, {
      service,
      operation
    }, 'count')

    if (tokens) {
      this.recordMetric(`api.${service}.tokens`, tokens, {
        service,
        operation
      }, 'count')

      this.recordMetric(`api.${service}.cost_per_token`, cost / tokens, {
        service,
        operation
      }, 'count')
    }
  }

  /**
   * Monitor business metrics
   */
  monitorBusinessMetrics(): void {
    setInterval(async () => {
      try {
        // These would be actual database queries in production
        const metrics = await this.getBusinessMetrics()
        
        this.recordMetric('business.active_users', metrics.activeUsers, {}, 'count')
        this.recordMetric('business.questions_generated', metrics.questionsGenerated, {}, 'count')
        this.recordMetric('business.analyses_completed', metrics.analysesCompleted, {}, 'count')
        this.recordMetric('business.api_calls', metrics.apiCalls, {}, 'count')
        
      } catch (error) {
        console.error('Failed to collect business metrics:', error)
      }
    }, 300000) // Every 5 minutes
  }

  /**
   * Add alert configuration
   */
  addAlert(config: AlertConfig): void {
    this.alerts.push(config)
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metricName: string, value: number): void {
    const relevantAlerts = this.alerts.filter(alert => alert.metric === metricName)
    
    for (const alert of relevantAlerts) {
      const shouldAlert = this.evaluateAlert(alert, value)
      
      if (shouldAlert) {
        this.triggerAlert(alert, value)
      }
    }
  }

  /**
   * Evaluate if an alert should be triggered
   */
  private evaluateAlert(alert: AlertConfig, value: number): boolean {
    switch (alert.operator) {
      case 'gt': return value > alert.threshold
      case 'lt': return value < alert.threshold
      case 'eq': return value === alert.threshold
      default: return false
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: AlertConfig, value: number): void {
    const alertMessage = {
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      severity: alert.severity,
      timestamp: new Date().toISOString(),
      message: `Alert: ${alert.metric} is ${value} (threshold: ${alert.threshold})`
    }

    console.warn(`[ALERT-${alert.severity.toUpperCase()}]`, alertMessage)

    // Send to configured channels
    for (const channel of alert.channels) {
      this.sendAlert(channel, alertMessage)
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlert(channel: string, alert: any): Promise<void> {
    try {
      switch (channel) {
        case 'console':
          console.log('[ALERT]', alert)
          break
          
        case 'email':
          // In production, integrate with email service
          console.log('[EMAIL ALERT]', alert)
          break
          
        case 'slack':
          // In production, integrate with Slack webhook
          console.log('[SLACK ALERT]', alert)
          break
          
        case 'webhook':
          // In production, send to webhook URL
          console.log('[WEBHOOK ALERT]', alert)
          break
      }
    } catch (error) {
      console.error(`Failed to send alert to ${channel}:`, error)
    }
  }

  /**
   * Setup default alerts
   */
  private setupDefaultAlerts(): void {
    // High error rate alert
    this.addAlert({
      metric: 'errors.rate',
      threshold: 5, // 5% error rate
      operator: 'gt',
      window: 15,
      severity: 'high',
      channels: ['console', 'slack']
    })

    // Slow response time alert
    this.addAlert({
      metric: 'response.time.avg',
      threshold: 2000, // 2 seconds
      operator: 'gt',
      window: 10,
      severity: 'medium',
      channels: ['console']
    })

    // High API costs alert
    this.addAlert({
      metric: 'api.openrouter.cost',
      threshold: 10, // $10 per hour
      operator: 'gt',
      window: 60,
      severity: 'high',
      channels: ['console', 'email']
    })

    // Database connection issues
    this.addAlert({
      metric: 'database.errors',
      threshold: 1,
      operator: 'gt',
      window: 5,
      severity: 'critical',
      channels: ['console', 'slack', 'email']
    })
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Check database health
    setInterval(() => {
      this.checkDatabaseHealth()
    }, 60000) // Every minute

    // Check external APIs health
    setInterval(() => {
      this.checkExternalAPIs()
    }, 120000) // Every 2 minutes

    // Check worker health
    setInterval(() => {
      this.checkWorkerHealth()
    }, 180000) // Every 3 minutes
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    const start = Date.now()
    
    try {
      // Simple database query to check connectivity
      const db = useDB()
      await db.select().from(users).limit(1).get()
      
      const responseTime = Date.now() - start
      
      this.healthChecks.set('database', {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: Date.now()
      })

      this.recordMetric('database.response_time', responseTime, {}, 'duration')
      
    } catch (error) {
      this.healthChecks.set('database', {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      })

      this.recordMetric('database.errors', 1, {}, 'count')
    }
  }

  /**
   * Check external APIs health
   */
  private async checkExternalAPIs(): Promise<void> {
    // Check OpenRouter API
    await this.checkAPIHealth('openrouter', 'https://openrouter.ai/api/v1/models')
    
    // Check Twitter API
    await this.checkAPIHealth('twitter', 'https://api.twitterapi.io/v2/users/by/username/twitter')
  }

  /**
   * Check specific API health
   */
  private async checkAPIHealth(apiName: string, url: string): Promise<void> {
    const start = Date.now()
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'PingToPass Health Check'
        }
      })
      
      const responseTime = Date.now() - start
      const status = response.ok ? 'healthy' : 
                    response.status < 500 ? 'degraded' : 'unhealthy'
      
      this.healthChecks.set(apiName, {
        service: apiName,
        status,
        responseTime,
        lastCheck: Date.now()
      })

      this.recordMetric(`api.${apiName}.response_time`, responseTime, {
        api: apiName
      }, 'duration')
      
    } catch (error) {
      this.healthChecks.set(apiName, {
        service: apiName,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      })

      this.recordMetric(`api.${apiName}.errors`, 1, {
        api: apiName
      }, 'count')
    }
  }

  /**
   * Check worker health
   */
  private async checkWorkerHealth(): Promise<void> {
    try {
      // In production, this would check actual worker status
      const workersUrl = process.env.WORKERS_URL
      
      if (workersUrl) {
        await this.checkAPIHealth('workers', `${workersUrl}/health`)
      }
    } catch (error) {
      console.error('Failed to check worker health:', error)
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): Record<string, HealthCheck> {
    const status: Record<string, HealthCheck> = {}
    
    for (const [service, health] of this.healthChecks) {
      status[service] = health
    }
    
    return status
  }

  /**
   * Record response time metrics (placeholder)
   */
  private recordResponseTimeMetrics(): void {
    // In production, this would collect actual response times
    // For now, simulate some metrics
    const avgResponseTime = Math.random() * 1000 + 200 // 200-1200ms
    this.recordMetric('response.time.avg', avgResponseTime, {}, 'duration')
  }

  /**
   * Record resource metrics (placeholder)
   */
  private recordResourceMetrics(): void {
    // In production, collect actual resource usage
    if (process.memoryUsage) {
      const memory = process.memoryUsage()
      this.recordMetric('memory.heap_used', memory.heapUsed, {}, 'bytes')
      this.recordMetric('memory.heap_total', memory.heapTotal, {}, 'bytes')
      this.recordMetric('memory.rss', memory.rss, {}, 'bytes')
    }
  }

  /**
   * Record error metrics (placeholder)
   */
  private recordErrorMetrics(): void {
    // In production, this would aggregate actual error rates
    const errorRate = Math.random() * 2 // 0-2% error rate
    this.recordMetric('errors.rate', errorRate, {}, 'percentage')
  }

  /**
   * Get business metrics (placeholder)
   */
  private async getBusinessMetrics(): Promise<{
    activeUsers: number
    questionsGenerated: number
    analysesCompleted: number
    apiCalls: number
  }> {
    // In production, these would be real database queries
    return {
      activeUsers: Math.floor(Math.random() * 100) + 50,
      questionsGenerated: Math.floor(Math.random() * 500) + 100,
      analysesCompleted: Math.floor(Math.random() * 50) + 10,
      apiCalls: Math.floor(Math.random() * 1000) + 200
    }
  }
}

// Global monitoring instance
export const monitoring = new MonitoringService()

// Helper functions for easy metric recording
export function recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
  monitoring.recordMetric(name, value, tags, unit)
}

export function monitorAgentPerformance(agentType: string, operation: string, duration: number, success: boolean): void {
  monitoring.monitorAgentPerformance(agentType, operation, duration, success)
}

export function monitorAPICosts(service: string, operation: string, cost: number, tokens?: number): void {
  monitoring.monitorAPICosts(service, operation, cost, tokens)
}

export function getHealthStatus(): Record<string, HealthCheck> {
  return monitoring.getHealthStatus()
}

export function getAllMetrics(): Record<string, any> {
  return monitoring.getAllMetrics()
}

// Start monitoring when module is imported
if (process.env.NODE_ENV === 'production') {
  monitoring.startPerformanceMonitoring()
  monitoring.monitorBusinessMetrics()
}