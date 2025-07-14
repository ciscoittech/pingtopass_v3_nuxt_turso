import { useDB } from '~/server/utils/db'
import { objectives } from '~/server/database/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { withCache, cacheKeys } from '~/server/utils/cache'
import { checkRateLimit, getClientIP, schemas, getSecurityHeaders } from '~/server/utils/security'

export default defineEventHandler(async (event) => {
  try {
    // Apply security headers
    for (const [header, value] of Object.entries(getSecurityHeaders())) {
      setHeader(event, header, value)
    }

    // Rate limiting
    const clientIP = getClientIP(event)
    const rateLimit = checkRateLimit(`objectives_${clientIP}`, 100, 60000) // 100 requests per minute
    
    if (!rateLimit.allowed) {
      setHeader(event, 'X-RateLimit-Limit', '100')
      setHeader(event, 'X-RateLimit-Remaining', '0')
      setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests'
      })
    }

    setHeader(event, 'X-RateLimit-Limit', '100')
    setHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

    const query = getQuery(event)
    const examId = query.examId as string
    const limit = Math.min(parseInt(query.limit as string) || 100, 100) // Cap at 100
    const offset = Math.max(parseInt(query.offset as string) || 0, 0) // Ensure non-negative

    // Validate examId if provided
    if (examId && !schemas.id.safeParse(examId).success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid exam ID format'
      })
    }

    // Use cache for performance
    const cacheKey = cacheKeys.objectives(examId)
    
    const result = await withCache(cacheKey, async () => {
      const db = useDB()
      
      let objectivesQuery = db
        .select()
        .from(objectives)
        .limit(limit)
        .offset(offset)
        .orderBy(objectives.title)

      // Filter by exam if provided
      if (examId) {
        objectivesQuery = objectivesQuery.where(eq(objectives.examId, examId))
      }

      const examObjectives = await objectivesQuery

      // Get total count for pagination
      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(objectives)

      if (examId) {
        countQuery = countQuery.where(eq(objectives.examId, examId))
      }

      const totalCount = await countQuery.then(rows => rows[0]?.count || 0)

      return {
        data: examObjectives,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    }, 600) // Cache for 10 minutes

    return {
      success: true,
      ...result,
      cached: true
    }

  } catch (error: any) {
    console.error('Get objectives error:', error)
    
    // Don't expose internal errors to client
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch objectives'
    })
  }
})