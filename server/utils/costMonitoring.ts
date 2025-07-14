/**
 * Cost monitoring and optimization for Cloudflare Workers and external APIs
 * 
 * Tracks usage across:
 * - OpenRouter API calls and token consumption
 * - TwitterAPI.io requests
 * - Cloudflare Workers CPU time
 * - Database operations
 * - Storage usage (KV, R2)
 */

import { recordMetric, monitorAPICosts } from './monitoring'

// Cost tracking interfaces
interface CostTracker {
  service: string
  operation: string
  cost: number
  tokens?: number
  timestamp: number
  metadata?: Record<string, any>
}

interface UsageLimits {
  daily: {
    openrouter_cost: number // $5 daily limit
    twitter_requests: number // 1000 requests daily
    worker_cpu_seconds: number // 100 seconds daily
    storage_operations: number // 10000 operations daily
  }
  monthly: {
    total_cost: number // $50 monthly limit
    openrouter_cost: number // $30 monthly limit
    twitter_cost: number // $10 monthly limit
    worker_cost: number // $5 monthly limit
    storage_cost: number // $5 monthly limit
  }
}

class CostMonitoringService {
  private costs: CostTracker[] = []
  private limits: UsageLimits
  
  constructor() {
    this.limits = {
      daily: {
        openrouter_cost: 5.0, // $5 per day
        twitter_requests: 1000,
        worker_cpu_seconds: 100,
        storage_operations: 10000
      },
      monthly: {
        total_cost: 50.0, // $50 per month
        openrouter_cost: 30.0, // $30 per month
        twitter_cost: 10.0, // $10 per month
        worker_cost: 5.0, // $5 per month
        storage_cost: 5.0 // $5 per month
      }
    }
    
    this.startCostMonitoring()
  }
  
  /**
   * Track OpenRouter API costs
   */
  trackOpenRouterCost(operation: string, tokens: number, model: string = 'unknown'): void {
    // OpenRouter pricing (approximate)
    const costs = {
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }, // per 1K tokens
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.005, output: 0.015 }
    }
    
    const modelCost = costs[model as keyof typeof costs] || costs['claude-3-haiku']
    
    // Assume 50/50 split between input and output tokens
    const inputTokens = Math.floor(tokens * 0.6)
    const outputTokens = Math.floor(tokens * 0.4)
    
    const cost = (inputTokens / 1000) * modelCost.input + (outputTokens / 1000) * modelCost.output
    
    this.recordCost({
      service: 'openrouter',
      operation,
      cost,
      tokens,
      timestamp: Date.now(),
      metadata: { model, inputTokens, outputTokens }
    })
    
    // Record monitoring metrics
    monitorAPICosts('openrouter', operation, cost, tokens)
    
    // Check limits
    this.checkLimits('openrouter', cost)
  }
  
  /**
   * Track Twitter API costs
   */
  trackTwitterCost(operation: string, requests: number = 1): void {
    // TwitterAPI.io pricing: ~$0.01 per 100 requests
    const costPerRequest = 0.0001
    const cost = requests * costPerRequest
    
    this.recordCost({
      service: 'twitter',
      operation,
      cost,
      timestamp: Date.now(),
      metadata: { requests }
    })
    
    monitorAPICosts('twitter', operation, cost)
    
    // Track request limits
    recordMetric('twitter.requests', requests, { operation }, 'count')
    this.checkLimits('twitter', cost, requests)
  }
  
  /**
   * Track Cloudflare Workers costs
   */
  trackWorkerCost(cpuTime: number, requests: number = 1): void {
    // Cloudflare Workers pricing:
    // - $0.50 per million requests
    // - $0.02 per 100,000 GB-seconds
    
    const requestCost = (requests / 1000000) * 0.50
    const cpuCost = (cpuTime / 1000 / 100000) * 0.02 // cpuTime in ms, convert to GB-seconds
    const totalCost = requestCost + cpuCost
    
    this.recordCost({
      service: 'cloudflare',
      operation: 'worker_execution',
      cost: totalCost,
      timestamp: Date.now(),
      metadata: { requests, cpuTime, requestCost, cpuCost }
    })
    
    recordMetric('worker.cpu_time', cpuTime, {}, 'duration')
    recordMetric('worker.requests', requests, {}, 'count')
    recordMetric('worker.cost', totalCost, {}, 'count')
  }
  
  /**
   * Track storage costs (KV, R2)
   */
  trackStorageCost(service: 'kv' | 'r2', operation: string, operations: number = 1, storage?: number): void {
    let cost = 0
    
    if (service === 'kv') {
      // KV pricing: $0.50 per million operations
      cost = (operations / 1000000) * 0.50
    } else if (service === 'r2') {
      // R2 pricing: $0.36 per million operations + storage
      const operationCost = (operations / 1000000) * 0.36
      const storageCost = storage ? (storage / 1024 / 1024 / 1024) * 0.015 : 0 // $0.015 per GB/month
      cost = operationCost + storageCost
    }
    
    this.recordCost({
      service,
      operation,
      cost,
      timestamp: Date.now(),
      metadata: { operations, storage }
    })
    
    recordMetric(`${service}.operations`, operations, { operation }, 'count')
    recordMetric(`${service}.cost`, cost, { operation }, 'count')
  }
  
  /**
   * Record cost entry
   */
  private recordCost(cost: CostTracker): void {
    this.costs.push(cost)
    
    // Keep only last 1000 entries
    if (this.costs.length > 1000) {
      this.costs = this.costs.slice(-1000)
    }
    
    // Record general cost metric
    recordMetric(`cost.${cost.service}`, cost.cost, {
      operation: cost.operation,
      service: cost.service
    }, 'count')
  }
  
  /**
   * Check cost limits and alert if exceeded
   */
  private checkLimits(service: string, cost: number, requests?: number): void {
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Calculate daily costs
    const dailyCosts = this.getCostsSince(dayStart.getTime())
    const monthlyCosts = this.getCostsSince(monthStart.getTime())
    
    // Check daily limits
    const dailyServiceCost = dailyCosts
      .filter(c => c.service === service)
      .reduce((sum, c) => sum + c.cost, 0)
    
    if (service === 'openrouter' && dailyServiceCost > this.limits.daily.openrouter_cost) {
      this.triggerAlert('daily_openrouter_limit', {
        current: dailyServiceCost,
        limit: this.limits.daily.openrouter_cost,
        service
      })
    }
    
    // Check monthly limits
    const monthlyServiceCost = monthlyCosts
      .filter(c => c.service === service)
      .reduce((sum, c) => sum + c.cost, 0)
    
    const totalMonthlyCost = monthlyCosts.reduce((sum, c) => sum + c.cost, 0)
    
    if (totalMonthlyCost > this.limits.monthly.total_cost) {
      this.triggerAlert('monthly_total_limit', {
        current: totalMonthlyCost,
        limit: this.limits.monthly.total_cost
      })
    }
    
    // Check request limits for Twitter
    if (service === 'twitter' && requests) {
      const dailyRequests = dailyCosts
        .filter(c => c.service === 'twitter')
        .reduce((sum, c) => sum + (c.metadata?.requests || 0), 0)
      
      if (dailyRequests > this.limits.daily.twitter_requests) {
        this.triggerAlert('daily_twitter_requests', {
          current: dailyRequests,
          limit: this.limits.daily.twitter_requests
        })
      }
    }
  }
  
  /**
   * Get costs since timestamp
   */
  private getCostsSince(timestamp: number): CostTracker[] {
    return this.costs.filter(cost => cost.timestamp >= timestamp)
  }
  
  /**
   * Trigger cost alert
   */
  private triggerAlert(type: string, data: any): void {
    console.warn(`[COST ALERT] ${type}:`, data)
    
    recordMetric('cost.alert', 1, {
      type,
      service: data.service || 'unknown'
    }, 'count')
    
    // In production, this would send alerts via email/Slack
    // For now, just log the alert
  }
  
  /**
   * Get cost summary
   */
  getCostSummary(days = 30): {
    total: number
    byService: Record<string, number>
    byDay: Array<{ date: string; cost: number }>
    projectedMonthly: number
    warnings: string[]
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const recentCosts = this.getCostsSince(cutoff)
    
    const total = recentCosts.reduce((sum, c) => sum + c.cost, 0)
    
    const byService: Record<string, number> = {}
    recentCosts.forEach(cost => {
      byService[cost.service] = (byService[cost.service] || 0) + cost.cost
    })
    
    // Group by day
    const byDay: Record<string, number> = {}
    recentCosts.forEach(cost => {
      const date = new Date(cost.timestamp).toISOString().split('T')[0]
      byDay[date] = (byDay[date] || 0) + cost.cost
    })
    
    const byDayArray = Object.entries(byDay)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Project monthly cost based on recent usage
    const dailyAverage = total / days
    const projectedMonthly = dailyAverage * 30
    
    // Generate warnings
    const warnings: string[] = []
    if (projectedMonthly > this.limits.monthly.total_cost * 0.8) {
      warnings.push(`Projected monthly cost ($${projectedMonthly.toFixed(2)}) approaching limit ($${this.limits.monthly.total_cost})`)
    }
    
    if (byService.openrouter && byService.openrouter > this.limits.monthly.openrouter_cost * 0.8) {
      warnings.push(`OpenRouter costs approaching monthly limit`)
    }
    
    return {
      total,
      byService,
      byDay: byDayArray,
      projectedMonthly,
      warnings
    }
  }
  
  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    category: string
    title: string
    description: string
    potential_savings: number
    effort: 'low' | 'medium' | 'high'
  }> {
    const summary = this.getCostSummary()
    const recommendations: Array<{
      category: string
      title: string
      description: string
      potential_savings: number
      effort: 'low' | 'medium' | 'high'
    }> = []
    
    // OpenRouter optimization
    if (summary.byService.openrouter > 10) {
      recommendations.push({
        category: 'ai',
        title: 'Optimize AI Model Usage',
        description: 'Use Claude Haiku for simple tasks instead of Sonnet',
        potential_savings: summary.byService.openrouter * 0.7,
        effort: 'low'
      })
      
      recommendations.push({
        category: 'ai',
        title: 'Implement Response Caching',
        description: 'Cache AI responses for similar questions',
        potential_savings: summary.byService.openrouter * 0.3,
        effort: 'medium'
      })
    }
    
    // Twitter optimization
    if (summary.byService.twitter > 2) {
      recommendations.push({
        category: 'api',
        title: 'Batch Twitter API Calls',
        description: 'Group multiple requests to reduce API calls',
        potential_savings: summary.byService.twitter * 0.4,
        effort: 'medium'
      })
    }
    
    // Worker optimization
    if (summary.byService.cloudflare > 1) {
      recommendations.push({
        category: 'performance',
        title: 'Optimize Worker Performance',
        description: 'Reduce CPU time and memory usage',
        potential_savings: summary.byService.cloudflare * 0.2,
        effort: 'high'
      })
    }
    
    return recommendations
  }
  
  /**
   * Start periodic cost monitoring
   */
  private startCostMonitoring(): void {
    // Clean up old cost entries every hour
    setInterval(() => {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
      this.costs = this.costs.filter(cost => cost.timestamp >= cutoff)
    }, 60 * 60 * 1000)
    
    // Generate daily cost reports
    setInterval(() => {
      const summary = this.getCostSummary(1) // Last day
      console.log('[DAILY COST REPORT]', summary)
      
      recordMetric('cost.daily_total', summary.total, {}, 'count')
      
      Object.entries(summary.byService).forEach(([service, cost]) => {
        recordMetric('cost.daily_by_service', cost, { service }, 'count')
      })
    }, 24 * 60 * 60 * 1000) // Daily
  }
}

// Global cost monitoring instance
export const costMonitoring = new CostMonitoringService()

// Helper functions
export function trackOpenRouterCost(operation: string, tokens: number, model?: string): void {
  costMonitoring.trackOpenRouterCost(operation, tokens, model)
}

export function trackTwitterCost(operation: string, requests?: number): void {
  costMonitoring.trackTwitterCost(operation, requests)
}

export function trackWorkerCost(cpuTime: number, requests?: number): void {
  costMonitoring.trackWorkerCost(cpuTime, requests)
}

export function trackStorageCost(service: 'kv' | 'r2', operation: string, operations?: number, storage?: number): void {
  costMonitoring.trackStorageCost(service, operation, operations, storage)
}

export function getCostSummary(days?: number) {
  return costMonitoring.getCostSummary(days)
}

export function getOptimizationRecommendations() {
  return costMonitoring.getOptimizationRecommendations()
}

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  console.log('[COST MONITORING] Started cost tracking and optimization')
}