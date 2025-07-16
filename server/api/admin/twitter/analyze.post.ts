import { eq, inArray } from 'drizzle-orm'
import { twitterCompetitors, competitorMetrics, contentInsights, strategyRecommendations } from '~/server/database/schema'
import { TwitterAnalysisAgent } from '~/server/utils/twitterAnalysisAgent'
import { nanoid } from 'nanoid'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    // TODO: Add proper admin check when role system is implemented
    // For now, allow authenticated users

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

    const db = useDB()

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

    // Get API keys from environment
    const twitterApiKey = useRuntimeConfig().twitterApiKey
    const openRouterApiKey = useRuntimeConfig().openRouterApiKey

    if (!twitterApiKey || !openRouterApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Twitter API or OpenRouter API key not configured'
      })
    }

    // Initialize analysis agent
    const agent = new TwitterAnalysisAgent(twitterApiKey, openRouterApiKey)

    // Perform analysis
    const usernames = competitors.map(c => c.username)
    console.log(`Starting analysis of competitors: ${usernames.join(', ')}`)

    const analysisResult = await agent.analyzeCompetitors(usernames)

    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const timestamp = Math.floor(Date.now() / 1000)

    // Save competitor metrics
    for (const analysis of analysisResult.analyses) {
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
    for (const insight of analysisResult.insights) {
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

    // Save strategy recommendations if requested
    if (includeRecommendations) {
      for (const recommendation of analysisResult.recommendations) {
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

    return {
      success: true,
      data: {
        analyzed_competitors: analysisResult.analyses.length,
        insights_generated: analysisResult.insights.length,
        recommendations_created: includeRecommendations ? analysisResult.recommendations.length : 0,
        benchmarks: analysisResult.benchmarks,
        summary: {
          total_followers: analysisResult.analyses.reduce((sum, a) => sum + a.user.followers_count, 0),
          avg_engagement: analysisResult.analyses.reduce((sum, a) => sum + a.metrics.engagement_rate, 0) / analysisResult.analyses.length,
          total_tweets_analyzed: analysisResult.analyses.reduce((sum, a) => sum + a.recent_tweets.length, 0)
        }
      },
      message: `Successfully analyzed ${analysisResult.analyses.length} competitors`
    }

  } catch (error: any) {
    console.error('Twitter analysis failed:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Analysis failed'
    })
  }
})