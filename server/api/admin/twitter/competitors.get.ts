import { eq } from 'drizzle-orm'
import { twitterCompetitors } from '~/server/database/schema'
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
    
    // Get query parameters
    const query = getQuery(event)
    const { category, priority, active } = query

    let competitors = db.select().from(twitterCompetitors)

    // Apply filters
    if (category) {
      competitors = competitors.where(eq(twitterCompetitors.category, category as string))
    }
    if (priority) {
      competitors = competitors.where(eq(twitterCompetitors.priority, priority as string))
    }
    if (active !== undefined) {
      competitors = competitors.where(eq(twitterCompetitors.isActive, active === 'true'))
    }

    const results = await competitors

    return {
      success: true,
      data: {
        competitors: results,
        total: results.length,
        categories: ['direct', 'indirect', 'influencer'],
        priorities: ['high', 'medium', 'low']
      }
    }

  } catch (error: any) {
    console.error('Failed to fetch competitors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch competitors'
    })
  }
})