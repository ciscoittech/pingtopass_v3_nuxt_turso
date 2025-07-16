import { eq, inArray } from 'drizzle-orm'
import { twitterCompetitors, competitorMetrics, contentInsights, strategyRecommendations } from '~/server/database/schema'
import { TwitterAnalysisWorkflow } from '~/server/utils/langchain/workflows/twitter/analysis'
import { nanoid } from 'nanoid'

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
    const { competitorIds, includeRecommendations = true } = body

    if (!competitorIds || !Array.isArray(competitorIds) || competitorIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Competitor IDs array is required'
      })
    }

    if (competitorIds.length > 10) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Maximum 10 competitors can be analyzed at once'
      })
    }

    const db = useDatabase()

    // Get competitor details
    const competitors = await db
      .select()
      .from(twitterCompetitors)
      .where(inArray(twitterCompetitors.id, competitorIds))

    if (competitors.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No valid competitors found'
      })
    }

    // Get API key from runtime config
    const twitterApiKey = useRuntimeConfig().twitterApiKey

    // Run LangChain workflow
    console.log(`Starting LangChain analysis of competitors: ${competitors.map(c => c.username).join(', ')}`)
    
    const workflow = new TwitterAnalysisWorkflow(twitterApiKey)
    const result = await workflow.run({
      competitorUsernames: competitors.map(c => c.username),
      includeRecommendations,
      twitterApiKey
    })

    // Check for errors
    if (result.errors.length > 0) {
      console.warn('Workflow completed with errors:', result.errors)
    }

    const currentDate = new Date().toISOString().split('T')[0]
    const timestamp = Math.floor(Date.now() / 1000)

    // Save competitor metrics
    for (const analysis of result.competitorAnalyses) {
      const competitor = competitors.find(c => c.username === analysis.user.username)
      if (!competitor) continue

      const metricId = `metric_${nanoid()}`

      await db.insert(competitorMetrics).values({
        id: metricId,
        competitorId: competitor.id,
        date: currentDate,
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

      // Update last analyzed timestamp
      await db
        .update(twitterCompetitors)
        .set({ lastAnalyzed: timestamp })
        .where(eq(twitterCompetitors.id, competitor.id))
    }

    // Save insights
    for (const insight of result.insights) {
      const insightId = `insight_${nanoid()}`
      
      // Find associated competitors
      const associatedCompetitors = competitors.filter(c => 
        insight.competitors_involved?.includes(c.username)
      )

      for (const competitor of associatedCompetitors) {
        await db.insert(contentInsights).values({
          id: `${insightId}_${competitor.id}`,
          competitorId: competitor.id,
          insightType: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          impact: insight.impact,
          recommendation: insight.recommendation,
          supportingData: JSON.stringify({
            actionable_steps: insight.actionable_steps,
            competitors_involved: insight.competitors_involved
          }),
          createdAt: timestamp,
          isActionable: true
        })
      }
    }

    // Save strategy recommendations if included
    if (includeRecommendations && result.recommendations.length > 0) {
      for (const recommendation of result.recommendations) {
        const recId = `rec_${nanoid()}`

        await db.insert(strategyRecommendations).values({
          id: recId,
          type: recommendation.category,
          title: recommendation.title,
          description: recommendation.description,
          priority: recommendation.priority,
          effort: recommendation.effort,
          expectedImpact: recommendation.expected_impact,
          basedOnCompetitors: JSON.stringify(competitorIds),
          actionItems: JSON.stringify(recommendation.implementation_steps),
          metrics: JSON.stringify({
            success_metrics: recommendation.success_metrics,
            timeline: recommendation.timeline,
            budget_required: recommendation.budget_required
          }),
          status: 'pending',
          createdAt: timestamp,
          updatedAt: timestamp
        })
      }
    }

    // Calculate execution time
    const executionTime = result.endTime && result.startTime ? 
      (result.endTime - result.startTime) / 1000 : 0

    return {
      success: true,
      data: {
        analyzed_competitors: result.competitorAnalyses.length,
        insights_generated: result.insights.length,
        recommendations_created: result.recommendations.length,
        benchmarks: result.benchmarks,
        trends: result.trendReport,
        alerts: result.alerts,
        predictions: result.predictions,
        opportunities: result.opportunities,
        workflow: {
          steps_completed: result.workflowSteps,
          total_cost: result.totalCost.toFixed(4),
          execution_time: `${executionTime.toFixed(2)}s`,
          errors: result.errors
        },
        summary: {
          total_followers: result.competitorAnalyses.reduce((sum, a) => sum + a.user.followers_count, 0),
          avg_engagement: result.competitorAnalyses.reduce((sum, a) => sum + a.metrics.engagement_rate, 0) / result.competitorAnalyses.length,
          total_tweets_analyzed: result.competitorAnalyses.reduce((sum, a) => sum + a.recent_tweets.length, 0)
        }
      },
      message: `Successfully analyzed ${result.competitorAnalyses.length} competitors using LangChain workflow`
    }

  } catch (error: any) {
    console.error('Twitter LangChain analysis failed:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Analysis failed'
    })
  }
})