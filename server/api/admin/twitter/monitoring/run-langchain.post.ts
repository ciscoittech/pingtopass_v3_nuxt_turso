import { eq, desc } from 'drizzle-orm'
import { competitorMetrics, twitterCompetitors, monitoringAlerts } from '~/server/database/schema'
import { TwitterMonitoringWorkflow } from '~/server/utils/langchain/workflows/twitter/monitoring'
import { nanoid } from 'nanoid'
import type { CompetitorAnalysis } from '~/server/utils/langchain/agents/twitter/types'

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

    const body = await readBody(event)
    const { 
      competitorIds,
      alertThresholds = {
        followerChangePercent: 10,
        engagementChangePercent: 20,
        postingFrequencyChangePercent: 30
      }
    } = body

    if (!competitorIds || !Array.isArray(competitorIds) || competitorIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Competitor IDs array is required'
      })
    }

    const db = useDatabase()

    // Get competitor details
    const competitors = await db
      .select()
      .from(twitterCompetitors)
      .where(eq(twitterCompetitors.isActive, true))

    const selectedCompetitors = competitors.filter(c => competitorIds.includes(c.id))

    if (selectedCompetitors.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No active competitors found'
      })
    }

    // Get previous analyses (most recent metrics for each competitor)
    const previousAnalyses = new Map<string, CompetitorAnalysis>()
    
    for (const competitor of selectedCompetitors) {
      const lastMetric = await db
        .select()
        .from(competitorMetrics)
        .where(eq(competitorMetrics.competitorId, competitor.id))
        .orderBy(desc(competitorMetrics.createdAt))
        .limit(1)

      if (lastMetric.length > 0) {
        const metric = lastMetric[0]
        
        // Convert database metric to CompetitorAnalysis format
        const analysis: CompetitorAnalysis = {
          user: {
            id: competitor.id,
            username: competitor.username,
            name: competitor.name || competitor.username,
            followers_count: metric.followersCount,
            following_count: 0, // Not stored in metrics
            tweet_count: metric.tweetsCount,
            listed_count: 0,
            created_at: new Date(competitor.addedAt * 1000).toISOString(),
            verified: false
          },
          metrics: {
            engagement_rate: metric.engagementRate,
            avg_likes: metric.avgLikes,
            avg_retweets: metric.avgRetweets,
            avg_replies: metric.avgReplies,
            posting_frequency: metric.postingFrequency,
            hashtag_performance: {},
            top_performing_tweets: []
          },
          recent_tweets: [],
          content_themes: JSON.parse(metric.contentThemes as string),
          posting_patterns: {
            best_times: [],
            frequency_by_day: {},
            consistency_score: metric.consistencyScore
          },
          engagement_insights: {
            high_engagement_topics: [],
            viral_factors: JSON.parse(metric.viralFactors as string),
            audience_interaction_style: ''
          }
        }
        
        previousAnalyses.set(competitor.username, analysis)
      }
    }

    // Get API key
    const twitterApiKey = useRuntimeConfig().twitterApiKey

    // Run monitoring workflow
    console.log(`Running LangChain monitoring for ${selectedCompetitors.length} competitors`)
    
    const workflow = new TwitterMonitoringWorkflow(twitterApiKey)
    const result = await workflow.run({
      competitorUsernames: selectedCompetitors.map(c => c.username),
      previousAnalyses,
      alertThresholds,
      twitterApiKey
    })

    // Save alerts to database
    const timestamp = Math.floor(Date.now() / 1000)
    
    for (const alert of result.alerts) {
      const competitor = selectedCompetitors.find(c => c.username === alert.username)
      if (!competitor) continue

      await db.insert(monitoringAlerts).values({
        id: `alert_${nanoid()}`,
        competitorId: competitor.id,
        alertType: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        recommendation: alert.recommendation,
        data: JSON.stringify({
          changes: result.significantChanges.filter(c => c.username === alert.username),
          timestamp: alert.timestamp
        }),
        isRead: false,
        createdAt: timestamp
      })
    }

    // Update last analyzed timestamp for monitored competitors
    for (const [username, analysis] of result.currentAnalyses) {
      const competitor = selectedCompetitors.find(c => c.username === username)
      if (!competitor) continue

      // Save new metrics
      await db.insert(competitorMetrics).values({
        id: `metric_${nanoid()}`,
        competitorId: competitor.id,
        date: new Date().toISOString().split('T')[0],
        followersCount: analysis.user.followers_count,
        tweetsCount: analysis.user.tweet_count,
        avgLikes: analysis.metrics.avg_likes,
        avgRetweets: analysis.metrics.avg_retweets,
        avgReplies: analysis.metrics.avg_replies,
        engagementRate: analysis.metrics.engagement_rate,
        topHashtags: JSON.stringify(Object.keys(analysis.metrics.hashtag_performance).slice(0, 10)),
        contentThemes: JSON.stringify(analysis.content_themes),
        viralFactors: JSON.stringify(analysis.engagement_insights.viral_factors),
        postingFrequency: analysis.metrics.posting_frequency,
        consistencyScore: analysis.posting_patterns.consistency_score,
        createdAt: timestamp
      })

      // Update last analyzed
      await db
        .update(twitterCompetitors)
        .set({ lastAnalyzed: timestamp })
        .where(eq(twitterCompetitors.id, competitor.id))
    }

    // Calculate execution time
    const executionTime = result.monitoringEndTime && result.monitoringStartTime ? 
      (result.monitoringEndTime - result.monitoringStartTime) / 1000 : 0

    return {
      success: true,
      data: {
        monitored_competitors: result.competitorUsernames.length,
        significant_changes: result.significantChanges.length,
        alerts_generated: result.alerts.length,
        high_priority_alerts: result.alerts.filter(a => a.severity === 'high').length,
        changes_by_metric: result.significantChanges.reduce((acc, change) => {
          acc[change.metric] = (acc[change.metric] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        workflow: {
          steps_completed: result.workflowSteps,
          execution_time: `${executionTime.toFixed(2)}s`,
          errors: result.errors
        }
      },
      alerts: result.alerts,
      changes: result.significantChanges,
      message: `Monitoring completed: ${result.alerts.length} alerts generated`
    }

  } catch (error: any) {
    console.error('Twitter monitoring failed:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Monitoring failed'
    })
  }
})