import { desc, eq, and } from 'drizzle-orm'
import { contentInsights, strategyRecommendations, twitterCompetitors } from '~/server/database/schema'
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

    const db = useDB()
    const query = getQuery(event)
    
    const { 
      type, 
      impact, 
      competitorId, 
      limit = 50,
      includeRecommendations = true 
    } = query

    // Build insights query
    let insightsQuery = db
      .select({
        insight: contentInsights,
        competitor: {
          id: twitterCompetitors.id,
          username: twitterCompetitors.username,
          name: twitterCompetitors.name,
          category: twitterCompetitors.category
        }
      })
      .from(contentInsights)
      .leftJoin(twitterCompetitors, eq(contentInsights.competitorId, twitterCompetitors.id))
      .orderBy(desc(contentInsights.createdAt))
      .limit(parseInt(limit as string))

    // Apply filters
    const conditions = []
    
    if (type) {
      conditions.push(eq(contentInsights.insightType, type as string))
    }
    
    if (impact) {
      conditions.push(eq(contentInsights.impact, impact as string))
    }
    
    if (competitorId) {
      conditions.push(eq(contentInsights.competitorId, competitorId as string))
    }

    if (conditions.length > 0) {
      insightsQuery = insightsQuery.where(and(...conditions))
    }

    const insights = await insightsQuery

    // Get strategy recommendations if requested
    let recommendations = []
    if (includeRecommendations === 'true') {
      let recommendationsQuery = db
        .select()
        .from(strategyRecommendations)
        .orderBy(desc(strategyRecommendations.createdAt))
        .limit(20)

      const recConditions = []
      
      if (type) {
        recConditions.push(eq(strategyRecommendations.type, type as string))
      }

      if (recConditions.length > 0) {
        recommendationsQuery = recommendationsQuery.where(and(...recConditions))
      }

      recommendations = await recommendationsQuery
    }

    // Get statistics
    const stats = {
      total_insights: insights.length,
      by_type: {} as Record<string, number>,
      by_impact: {} as Record<string, number>,
      high_confidence: insights.filter(i => i.insight.confidence > 0.8).length,
      actionable: insights.filter(i => i.insight.isActionable).length
    }

    // Calculate breakdowns
    insights.forEach(({ insight }) => {
      stats.by_type[insight.insightType] = (stats.by_type[insight.insightType] || 0) + 1
      stats.by_impact[insight.impact] = (stats.by_impact[insight.impact] || 0) + 1
    })

    // Format insights with parsed supporting data
    const formattedInsights = insights.map(({ insight, competitor }) => ({
      ...insight,
      competitor,
      supportingData: insight.supportingData ? JSON.parse(insight.supportingData) : null,
      createdAt: new Date(insight.createdAt * 1000).toISOString()
    }))

    // Format recommendations with parsed data
    const formattedRecommendations = recommendations.map(rec => ({
      ...rec,
      basedOnCompetitors: rec.basedOnCompetitors ? JSON.parse(rec.basedOnCompetitors) : [],
      actionItems: rec.actionItems ? JSON.parse(rec.actionItems) : [],
      metrics: rec.metrics ? JSON.parse(rec.metrics) : {},
      createdAt: new Date(rec.createdAt * 1000).toISOString(),
      updatedAt: new Date(rec.updatedAt * 1000).toISOString()
    }))

    return {
      success: true,
      data: {
        insights: formattedInsights,
        recommendations: formattedRecommendations,
        statistics: stats,
        filters: {
          available_types: ['content_strategy', 'posting_pattern', 'engagement_tactics', 'audience_building', 'viral_content'],
          available_impacts: ['high', 'medium', 'low'],
          recommendation_types: ['content', 'timing', 'hashtags', 'engagement', 'audience']
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch insights:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch insights'
    })
  }
})