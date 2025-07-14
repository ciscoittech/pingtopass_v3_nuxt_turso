/**
 * Twitter Monitoring and Automation System
 * 
 * Handles scheduled analysis jobs, alerts, and automated monitoring
 */

import { eq, and, lte } from 'drizzle-orm'
import { monitoringJobs, twitterCompetitors, competitorMetrics } from '~/server/database/schema'
import { TwitterAnalysisAgent } from './twitterAnalysisAgent'
import { nanoid } from 'nanoid'

export interface MonitoringJobConfig {
  competitors?: string[] // Competitor IDs
  keywords?: string[]
  hashtags?: string[]
  frequency: 'daily' | 'weekly' | 'monthly'
  alerts: {
    follower_change_threshold: number
    engagement_change_threshold: number
    viral_content_threshold: number
    new_competitor_mentions: boolean
  }
  analysis_depth: 'basic' | 'detailed' | 'comprehensive'
}

export interface AlertEvent {
  type: 'follower_surge' | 'engagement_spike' | 'viral_content' | 'competitor_mention' | 'trend_opportunity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  competitor?: string
  metrics?: Record<string, number>
  recommendations?: string[]
  actionRequired: boolean
}

export class TwitterMonitoringService {
  private analysisAgent: TwitterAnalysisAgent

  constructor(twitterApiKey: string, openRouterApiKey: string) {
    this.analysisAgent = new TwitterAnalysisAgent(twitterApiKey, openRouterApiKey)
  }

  /**
   * Create a new monitoring job
   */
  async createMonitoringJob(
    name: string,
    type: 'competitor_analysis' | 'trend_monitoring' | 'hashtag_tracking',
    config: MonitoringJobConfig,
    schedule: string // Cron expression
  ): Promise<string> {
    const db = useDatabase()
    const jobId = `job_${nanoid()}`

    await db.insert(monitoringJobs).values({
      id: jobId,
      name,
      type,
      config: JSON.stringify(config),
      schedule,
      isActive: true,
      nextRun: this.getNextRunTime(schedule),
      status: 'pending',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    })

    return jobId
  }

  /**
   * Process due monitoring jobs
   */
  async processDueJobs(): Promise<{
    processed: number
    alerts: AlertEvent[]
    errors: string[]
  }> {
    const db = useDatabase()
    const now = Math.floor(Date.now() / 1000)

    // Get all active jobs that are due
    const dueJobs = await db
      .select()
      .from(monitoringJobs)
      .where(
        and(
          eq(monitoringJobs.isActive, true),
          lte(monitoringJobs.nextRun!, now)
        )
      )

    const results = {
      processed: 0,
      alerts: [] as AlertEvent[],
      errors: [] as string[]
    }

    for (const job of dueJobs) {
      try {
        console.log(`Processing monitoring job: ${job.name}`)

        // Update job status
        await db
          .update(monitoringJobs)
          .set({
            status: 'running',
            lastRun: now,
            updatedAt: now
          })
          .where(eq(monitoringJobs.id, job.id))

        const config: MonitoringJobConfig = JSON.parse(job.config)
        const jobResults = await this.executeJob(job.type, config)

        // Process results and generate alerts
        const alerts = await this.generateAlerts(jobResults, config)
        results.alerts.push(...alerts)

        // Update job with results
        await db
          .update(monitoringJobs)
          .set({
            status: 'completed',
            nextRun: this.getNextRunTime(job.schedule),
            results: JSON.stringify({
              timestamp: now,
              alerts: alerts.length,
              summary: jobResults.summary
            }),
            updatedAt: now
          })
          .where(eq(monitoringJobs.id, job.id))

        results.processed++

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error)
        results.errors.push(`Job ${job.name}: ${error}`)

        // Update job status to failed
        await db
          .update(monitoringJobs)
          .set({
            status: 'failed',
            nextRun: this.getNextRunTime(job.schedule),
            results: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
              timestamp: now
            }),
            updatedAt: now
          })
          .where(eq(monitoringJobs.id, job.id))
      }
    }

    return results
  }

  /**
   * Execute a specific monitoring job
   */
  private async executeJob(
    type: string,
    config: MonitoringJobConfig
  ): Promise<{
    summary: Record<string, any>
    metrics: Record<string, number>
    insights: any[]
    changes: any[]
  }> {
    switch (type) {
      case 'competitor_analysis':
        return await this.executeCompetitorAnalysis(config)
      
      case 'trend_monitoring':
        return await this.executeTrendMonitoring(config)
      
      case 'hashtag_tracking':
        return await this.executeHashtagTracking(config)
      
      default:
        throw new Error(`Unknown job type: ${type}`)
    }
  }

  /**
   * Execute competitor analysis job
   */
  private async executeCompetitorAnalysis(config: MonitoringJobConfig): Promise<any> {
    const db = useDatabase()

    // Get competitor usernames
    let competitors: any[] = []
    if (config.competitors && config.competitors.length > 0) {
      competitors = await db
        .select()
        .from(twitterCompetitors)
        .where(
          and(
            eq(twitterCompetitors.isActive, true),
            // Add proper where clause for competitor IDs
          )
        )
    } else {
      // Get all active competitors
      competitors = await db
        .select()
        .from(twitterCompetitors)
        .where(eq(twitterCompetitors.isActive, true))
        .limit(10)
    }

    if (competitors.length === 0) {
      return {
        summary: { message: 'No active competitors to analyze' },
        metrics: {},
        insights: [],
        changes: []
      }
    }

    // Run analysis
    const usernames = competitors.map(c => c.username)
    const analysisResult = await this.analysisAgent.analyzeCompetitors(usernames)

    // Detect significant changes by comparing with previous metrics
    const changes = []
    for (const analysis of analysisResult.analyses) {
      const competitor = competitors.find(c => c.username === analysis.user.username)
      if (!competitor) continue

      // Get previous metrics (last 7 days)
      const previousMetrics = await db
        .select()
        .from(competitorMetrics)
        .where(eq(competitorMetrics.competitorId, competitor.id))
        .orderBy(competitorMetrics.createdAt)
        .limit(7)

      if (previousMetrics.length > 0) {
        const latestPrevious = previousMetrics[0]
        const changeDetection = await this.analysisAgent.detectCompetitorChanges(
          analysis.user.username,
          {
            user: analysis.user,
            recent_tweets: [], // Simplified for monitoring
            metrics: {
              engagement_rate: latestPrevious.engagementRate,
              avg_likes: latestPrevious.avgLikes,
              avg_retweets: latestPrevious.avgRetweets,
              avg_replies: latestPrevious.avgReplies,
              posting_frequency: latestPrevious.postingFrequency,
              hashtag_performance: {},
              top_performing_tweets: []
            },
            content_themes: JSON.parse(latestPrevious.contentThemes || '[]'),
            posting_patterns: {
              best_times: [],
              frequency: 'daily',
              consistency_score: latestPrevious.consistencyScore
            },
            engagement_insights: {
              top_content_types: [],
              audience_engagement: 'medium',
              viral_factors: JSON.parse(latestPrevious.viralFactors || '[]')
            }
          }
        )

        changes.push(...changeDetection.significant_changes.map(change => ({
          competitor: competitor.username,
          ...change
        })))
      }
    }

    return {
      summary: {
        competitors_analyzed: analysisResult.analyses.length,
        insights_generated: analysisResult.insights.length,
        significant_changes: changes.length
      },
      metrics: {
        total_followers: analysisResult.analyses.reduce((sum, a) => sum + a.user.followers_count, 0),
        avg_engagement: analysisResult.analyses.reduce((sum, a) => sum + a.metrics.engagement_rate, 0) / analysisResult.analyses.length
      },
      insights: analysisResult.insights,
      changes
    }
  }

  /**
   * Execute trend monitoring job
   */
  private async executeTrendMonitoring(config: MonitoringJobConfig): Promise<any> {
    // Get trending topics and analyze for opportunities
    const contentOpportunities = await this.analysisAgent.analyzeContentOpportunities(
      config.competitors || []
    )

    return {
      summary: {
        trending_themes: contentOpportunities.trending_themes.length,
        content_gaps: contentOpportunities.content_gaps.length,
        viral_patterns: contentOpportunities.viral_patterns.length
      },
      metrics: {
        high_engagement_themes: contentOpportunities.trending_themes.filter(t => t.engagement > 50).length
      },
      insights: [contentOpportunities],
      changes: []
    }
  }

  /**
   * Execute hashtag tracking job
   */
  private async executeHashtagTracking(config: MonitoringJobConfig): Promise<any> {
    // Simple hashtag performance tracking
    // In a real implementation, this would track specific hashtags over time
    
    return {
      summary: {
        hashtags_tracked: config.hashtags?.length || 0,
        performance_changes: 0
      },
      metrics: {},
      insights: [],
      changes: []
    }
  }

  /**
   * Generate alerts based on job results
   */
  private async generateAlerts(
    jobResults: any,
    config: MonitoringJobConfig
  ): Promise<AlertEvent[]> {
    const alerts: AlertEvent[] = []

    // Check for significant changes
    for (const change of jobResults.changes || []) {
      if (Math.abs(change.change_percentage) >= config.alerts.engagement_change_threshold) {
        alerts.push({
          type: change.change_percentage > 0 ? 'engagement_spike' : 'engagement_spike',
          severity: Math.abs(change.change_percentage) > 50 ? 'high' : 'medium',
          title: `${change.competitor} ${change.metric} ${change.change_percentage > 0 ? 'increased' : 'decreased'} significantly`,
          description: change.insight,
          competitor: change.competitor,
          metrics: {
            previous_value: change.previous_value,
            current_value: change.current_value,
            change_percentage: change.change_percentage
          },
          recommendations: [
            'Analyze their recent content strategy',
            'Monitor for continued trend',
            'Consider adapting successful tactics'
          ],
          actionRequired: change.significance === 'high'
        })
      }
    }

    // Check for viral content opportunities
    if (jobResults.insights) {
      const viralInsights = jobResults.insights.filter((insight: any) => 
        insight.type === 'viral_content' && insight.confidence > 0.7
      )

      for (const insight of viralInsights) {
        alerts.push({
          type: 'viral_content',
          severity: 'medium',
          title: 'Viral content opportunity identified',
          description: insight.description,
          recommendations: insight.actionable_steps || [],
          actionRequired: true
        })
      }
    }

    // Check for trending opportunities
    if (jobResults.summary?.trending_themes > 5) {
      alerts.push({
        type: 'trend_opportunity',
        severity: 'medium',
        title: 'Multiple trending themes detected',
        description: `${jobResults.summary.trending_themes} relevant themes are trending`,
        recommendations: [
          'Review trending themes for content opportunities',
          'Create timely content around trending topics',
          'Monitor competitor response to trends'
        ],
        actionRequired: true
      })
    }

    return alerts
  }

  /**
   * Calculate next run time from cron expression
   */
  private getNextRunTime(cronExpression: string): number {
    // Simple cron parsing - in production, use a proper cron library
    const now = new Date()
    
    // Basic patterns
    if (cronExpression === '0 0 * * *') { // Daily at midnight
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return Math.floor(tomorrow.getTime() / 1000)
    }
    
    if (cronExpression === '0 0 * * 0') { // Weekly on Sunday
      const nextSunday = new Date(now)
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()))
      nextSunday.setHours(0, 0, 0, 0)
      return Math.floor(nextSunday.getTime() / 1000)
    }
    
    if (cronExpression === '0 0 1 * *') { // Monthly on 1st
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
      nextMonth.setHours(0, 0, 0, 0)
      return Math.floor(nextMonth.getTime() / 1000)
    }

    // Default: 24 hours from now
    return Math.floor((now.getTime() + 24 * 60 * 60 * 1000) / 1000)
  }

  /**
   * Send alerts to configured channels
   */
  async sendAlerts(alerts: AlertEvent[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // In a real implementation, send to:
        // - Email notifications
        // - Slack/Discord webhooks
        // - In-app notifications
        // - SMS for critical alerts
        
        console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`)
        console.log(`Description: ${alert.description}`)
        
        if (alert.recommendations && alert.recommendations.length > 0) {
          console.log(`Recommendations: ${alert.recommendations.join(', ')}`)
        }

        // Store alert in database for admin dashboard
        // await this.storeAlert(alert)

      } catch (error) {
        console.error('Failed to send alert:', error)
      }
    }
  }
}