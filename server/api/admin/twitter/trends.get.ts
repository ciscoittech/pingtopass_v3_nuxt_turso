import { desc, eq, gte } from 'drizzle-orm'
import { trendingTopics, twitterCompetitors } from '~/server/database/schema'
import { TwitterClient } from '~/server/utils/twitterClient'
import { TwitterAnalysisAgent } from '~/server/utils/twitterAnalysisAgent'
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
      location = 'worldwide',
      refresh = false,
      includeOpportunities = true 
    } = query

    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Check if we need to refresh data
    let trends: any[] = []
    let shouldRefresh = refresh === 'true'

    if (!shouldRefresh) {
      // Check if we have recent data (within last 4 hours)
      const fourHoursAgo = Math.floor((Date.now() - 4 * 60 * 60 * 1000) / 1000)
      
      trends = await db
        .select()
        .from(trendingTopics)
        .where(
          eq(trendingTopics.location, location as string) &&
          gte(trendingTopics.createdAt, fourHoursAgo)
        )
        .orderBy(desc(trendingTopics.volume))

      shouldRefresh = trends.length === 0
    }

    // Fetch fresh data if needed
    if (shouldRefresh) {
      try {
        const twitterApiKey = useRuntimeConfig().twitterApiKey
        if (!twitterApiKey) {
          throw new Error('Twitter API key not configured')
        }

        const twitterClient = new TwitterClient(twitterApiKey)
        const freshTrends = await twitterClient.getTrends(location as string)

        // Save to database
        const timestamp = Math.floor(Date.now() / 1000)
        
        for (const trend of freshTrends) {
          // Calculate relevance score (simple keyword matching for IT/tech)
          const relevanceScore = calculateRelevanceScore(trend.tag)
          
          await db.insert(trendingTopics).values({
            id: `trend_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            tag: trend.tag,
            volume: trend.volume,
            category: trend.category,
            location: location as string,
            relevanceScore,
            opportunity: relevanceScore > 0.6 ? 
              generateOpportunityDescription(trend.tag, relevanceScore) : null,
            date: currentDate,
            createdAt: timestamp
          })
        }

        trends = freshTrends.map(trend => ({
          ...trend,
          relevanceScore: calculateRelevanceScore(trend.tag),
          date: currentDate,
          createdAt: timestamp
        }))

      } catch (error) {
        console.warn('Failed to fetch fresh trends, using cached data:', error)
        
        // Fall back to most recent cached data
        trends = await db
          .select()
          .from(trendingTopics)
          .where(eq(trendingTopics.location, location as string))
          .orderBy(desc(trendingTopics.createdAt))
          .limit(50)
      }
    }

    // Get content opportunities if requested
    let contentOpportunities = null
    if (includeOpportunities === 'true') {
      try {
        // Get active competitors
        const activeCompetitors = await db
          .select()
          .from(twitterCompetitors)
          .where(eq(twitterCompetitors.isActive, true))
          .limit(10)

        if (activeCompetitors.length > 0) {
          const twitterApiKey = useRuntimeConfig().twitterApiKey
          const openRouterApiKey = useRuntimeConfig().openRouterApiKey

          if (twitterApiKey && openRouterApiKey) {
            const agent = new TwitterAnalysisAgent(twitterApiKey, openRouterApiKey)
            
            const competitorUsernames = activeCompetitors.map(c => c.username)
            contentOpportunities = await agent.analyzeContentOpportunities(competitorUsernames)
          }
        }
      } catch (error) {
        console.warn('Failed to analyze content opportunities:', error)
      }
    }

    // Filter and categorize trends
    const relevantTrends = trends
      .filter(trend => trend.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)

    const trendCategories = {
      highly_relevant: trends.filter(t => t.relevanceScore > 0.7),
      moderately_relevant: trends.filter(t => t.relevanceScore >= 0.4 && t.relevanceScore <= 0.7),
      general_trends: trends.filter(t => t.relevanceScore < 0.4).slice(0, 10)
    }

    return {
      success: true,
      data: {
        trends: trends.slice(0, 50),
        relevant_trends: relevantTrends,
        trend_categories: trendCategories,
        content_opportunities: contentOpportunities,
        location: location,
        last_updated: trends.length > 0 ? 
          new Date(Math.max(...trends.map(t => t.createdAt * 1000))).toISOString() : 
          null,
        statistics: {
          total_trends: trends.length,
          highly_relevant: trendCategories.highly_relevant.length,
          with_opportunities: trends.filter(t => t.opportunity).length,
          average_relevance: trends.length > 0 ? 
            trends.reduce((sum, t) => sum + t.relevanceScore, 0) / trends.length : 0
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch trends:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch trends'
    })
  }
})

/**
 * Calculate relevance score for IT certification industry
 */
function calculateRelevanceScore(tag: string): number {
  const lowerTag = tag.toLowerCase()
  
  // High relevance keywords
  const highRelevance = [
    'aws', 'azure', 'gcp', 'cloud', 'certification', 'exam', 'cissp', 'ccna', 'comptia',
    'cybersecurity', 'security+', 'devops', 'kubernetes', 'docker', 'terraform',
    'python', 'javascript', 'coding', 'programming', 'developer', 'tech',
    'it', 'technology', 'software', 'infrastructure', 'network', 'database'
  ]
  
  // Medium relevance keywords
  const mediumRelevance = [
    'career', 'learning', 'education', 'training', 'skill', 'course',
    'tutorial', 'guide', 'tips', 'job', 'interview', 'resume',
    'professional', 'industry', 'business', 'remote', 'work'
  ]
  
  // Check for exact matches and partial matches
  let score = 0
  
  for (const keyword of highRelevance) {
    if (lowerTag.includes(keyword)) {
      score += 0.8
      break
    }
  }
  
  for (const keyword of mediumRelevance) {
    if (lowerTag.includes(keyword)) {
      score += 0.4
      break
    }
  }
  
  // Boost score for hashtags that look like tech terms
  if (/^[A-Z]{2,}$/.test(tag) || /\d+/.test(tag)) {
    score += 0.2
  }
  
  return Math.min(score, 1.0)
}

/**
 * Generate opportunity description based on relevance
 */
function generateOpportunityDescription(tag: string, relevance: number): string {
  if (relevance > 0.8) {
    return `High-value opportunity: Create educational content around ${tag} to capture trending interest`
  } else if (relevance > 0.6) {
    return `Moderate opportunity: Consider creating ${tag}-related content for increased visibility`
  } else {
    return `Potential opportunity: Monitor ${tag} trend for content creation possibilities`
  }
}