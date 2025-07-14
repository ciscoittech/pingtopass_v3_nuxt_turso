import { getCostSummary, getOptimizationRecommendations } from '~/server/utils/costMonitoring'
import { getAllMetrics } from '~/server/utils/monitoring'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const user = await requireUserSession(event)
    if (!user.user?.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const query = getQuery(event)
    const days = parseInt(query.days as string) || 30

    // Get cost summary
    const costSummary = getCostSummary(days)
    
    // Get optimization recommendations
    const recommendations = getOptimizationRecommendations()
    
    // Get related metrics
    const metrics = getAllMetrics()
    
    // Calculate usage trends
    const usageTrends = {
      openrouter: {
        daily_cost: costSummary.byDay.slice(-7).reduce((sum, day) => sum + day.cost, 0) / 7,
        trend: costSummary.byDay.length >= 7 ? 
          (costSummary.byDay.slice(-3).reduce((sum, day) => sum + day.cost, 0) / 3) /
          (costSummary.byDay.slice(-7, -3).reduce((sum, day) => sum + day.cost, 0) / 4) - 1 : 0
      },
      twitter: {
        daily_requests: metrics['api.twitter.requests']?.current || 0,
        monthly_projected: (metrics['api.twitter.requests']?.current || 0) * 30
      },
      worker: {
        cpu_time: metrics['worker.cpu_time']?.current || 0,
        memory_usage: metrics['worker.memory.heap_used']?.current || 0
      }
    }
    
    // Cost breakdown by category
    const costBreakdown = {
      ai_services: costSummary.byService.openrouter || 0,
      api_calls: costSummary.byService.twitter || 0,
      infrastructure: (costSummary.byService.cloudflare || 0) + (costSummary.byService.kv || 0) + (costSummary.byService.r2 || 0),
      total: costSummary.total
    }
    
    // Budget status
    const monthlyLimit = 50.0 // $50 monthly limit
    const budgetStatus = {
      current_month: costSummary.projectedMonthly,
      budget_limit: monthlyLimit,
      utilization: (costSummary.projectedMonthly / monthlyLimit) * 100,
      remaining: monthlyLimit - costSummary.projectedMonthly,
      days_left: 30 - new Date().getDate(),
      burn_rate: costSummary.total / days
    }
    
    // Alerts and warnings
    const alerts = []
    
    if (budgetStatus.utilization > 80) {
      alerts.push({
        type: 'budget',
        severity: 'high',
        message: `Monthly budget utilization at ${budgetStatus.utilization.toFixed(1)}%`,
        action: 'Consider implementing cost optimization measures'
      })
    }
    
    if (costSummary.warnings.length > 0) {
      alerts.push(...costSummary.warnings.map(warning => ({
        type: 'cost',
        severity: 'medium',
        message: warning,
        action: 'Review optimization recommendations'
      })))
    }
    
    // Top cost drivers
    const topCostDrivers = Object.entries(costSummary.byService)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([service, cost]) => ({
        service,
        cost,
        percentage: (cost / costSummary.total) * 100
      }))
    
    return {
      success: true,
      data: {
        summary: {
          period_days: days,
          total_cost: costSummary.total,
          projected_monthly: costSummary.projectedMonthly,
          average_daily: costSummary.total / days,
          last_updated: new Date().toISOString()
        },
        breakdown: costBreakdown,
        budget: budgetStatus,
        trends: usageTrends,
        top_drivers: topCostDrivers,
        daily_costs: costSummary.byDay,
        recommendations: recommendations,
        alerts: alerts,
        metrics: {
          total_api_calls: (metrics['api.openrouter.requests']?.current || 0) + 
                          (metrics['api.twitter.requests']?.current || 0),
          avg_response_time: metrics['response.time.avg']?.current || 0,
          error_rate: metrics['errors.rate']?.current || 0,
          uptime: metrics['uptime']?.current || 100
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch cost monitoring data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch cost monitoring data'
    })
  }
})