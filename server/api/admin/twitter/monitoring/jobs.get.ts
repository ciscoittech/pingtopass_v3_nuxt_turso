import { desc, eq } from 'drizzle-orm'
import { monitoringJobs } from '~/server/database/schema'

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

    const db = useDatabase()
    const query = getQuery(event)
    
    const { 
      type, 
      status, 
      active,
      limit = 50 
    } = query

    // Build query
    let jobsQuery = db
      .select()
      .from(monitoringJobs)
      .orderBy(desc(monitoringJobs.createdAt))
      .limit(parseInt(limit as string))

    // Apply filters
    const conditions = []
    
    if (type) {
      conditions.push(eq(monitoringJobs.type, type as string))
    }
    
    if (status) {
      conditions.push(eq(monitoringJobs.status, status as string))
    }
    
    if (active !== undefined) {
      conditions.push(eq(monitoringJobs.isActive, active === 'true'))
    }

    if (conditions.length > 0) {
      jobsQuery = jobsQuery.where(and(...conditions))
    }

    const jobs = await jobsQuery

    // Format jobs with parsed data
    const formattedJobs = jobs.map(job => ({
      ...job,
      config: job.config ? JSON.parse(job.config) : {},
      results: job.results ? JSON.parse(job.results) : null,
      nextRunDate: job.nextRun ? new Date(job.nextRun * 1000).toISOString() : null,
      lastRunDate: job.lastRun ? new Date(job.lastRun * 1000).toISOString() : null,
      createdAt: new Date(job.createdAt * 1000).toISOString(),
      updatedAt: new Date(job.updatedAt * 1000).toISOString()
    }))

    // Calculate statistics
    const stats = {
      total_jobs: jobs.length,
      active_jobs: jobs.filter(j => j.isActive).length,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      next_due: jobs
        .filter(j => j.isActive && j.nextRun)
        .sort((a, b) => a.nextRun! - b.nextRun!)[0]?.nextRun ?
        new Date(jobs.filter(j => j.isActive && j.nextRun).sort((a, b) => a.nextRun! - b.nextRun!)[0].nextRun! * 1000).toISOString() : null
    }

    // Calculate breakdowns
    jobs.forEach(job => {
      stats.by_status[job.status] = (stats.by_status[job.status] || 0) + 1
      stats.by_type[job.type] = (stats.by_type[job.type] || 0) + 1
    })

    return {
      success: true,
      data: {
        jobs: formattedJobs,
        statistics: stats,
        filters: {
          available_types: ['competitor_analysis', 'trend_monitoring', 'hashtag_tracking'],
          available_statuses: ['pending', 'running', 'completed', 'failed']
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch monitoring jobs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch monitoring jobs'
    })
  }
})