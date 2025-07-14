import { TwitterMonitoringService } from '~/server/utils/twitterMonitoring'

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

    // Get API keys from environment
    const twitterApiKey = useRuntimeConfig().twitterApiKey
    const openRouterApiKey = useRuntimeConfig().openRouterApiKey

    if (!twitterApiKey || !openRouterApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Twitter API or OpenRouter API key not configured'
      })
    }

    // Initialize monitoring service
    const monitoringService = new TwitterMonitoringService(twitterApiKey, openRouterApiKey)

    console.log('Running scheduled Twitter monitoring jobs...')

    // Process all due jobs
    const results = await monitoringService.processDueJobs()

    // Send alerts if any were generated
    if (results.alerts.length > 0) {
      await monitoringService.sendAlerts(results.alerts)
    }

    return {
      success: true,
      data: {
        jobs_processed: results.processed,
        alerts_generated: results.alerts.length,
        errors: results.errors.length,
        alerts: results.alerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          competitor: alert.competitor,
          action_required: alert.actionRequired
        })),
        error_details: results.errors
      },
      message: `Processed ${results.processed} monitoring jobs, generated ${results.alerts.length} alerts`
    }

  } catch (error: any) {
    console.error('Monitoring job execution failed:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Monitoring execution failed'
    })
  }
})