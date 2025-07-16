import { useDB } from '~/server/utils/db'
import { exams, vendors } from '~/server/database/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { withCache, cacheKeys } from '~/server/utils/cache'
import { checkRateLimit, getClientIP, schemas, validateRequest, getSecurityHeaders } from '~/server/utils/security'

export default defineEventHandler(async (event) => {
  try {
    // Apply security headers
    for (const [header, value] of Object.entries(getSecurityHeaders())) {
      setHeader(event, header, value)
    }

    // Rate limiting
    const clientIP = getClientIP(event)
    const rateLimit = checkRateLimit(`exams_${clientIP}`, 60, 60000) // 60 requests per minute
    
    if (!rateLimit.allowed) {
      setHeader(event, 'X-RateLimit-Limit', '60')
      setHeader(event, 'X-RateLimit-Remaining', '0')
      setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests'
      })
    }

    setHeader(event, 'X-RateLimit-Limit', '60')
    setHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

    // Get and validate query parameters
    const query = getQuery(event)
    const vendorId = query.vendor as string
    
    // Validate vendorId if provided
    if (vendorId && !schemas.id.safeParse(vendorId).success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid vendor ID format'
      })
    }

    // Use cache for performance
    const cacheKey = cacheKeys.exams(vendorId)
    
    const results = await withCache(cacheKey, async () => {
      const db = useDB()
      
      // Build where conditions
      const conditions = [eq(exams.isActive, true)]
      if (vendorId) {
        conditions.push(eq(exams.vendorId, vendorId))
      }
      
      // Build and execute query
      const rawResults = await db
        .select({
          id: exams.id,
          code: exams.code,
          name: exams.name,
          vendorId: exams.vendorId,
          vendorName: vendors.name,
          passingScore: exams.passingScore,
          duration: exams.duration,
          questionCount: exams.questionCount,
          isActive: exams.isActive,
          difficulty: sql<string>`'intermediate'`.as('difficulty'),
          userProgress: sql<number>`0`.as('userProgress'),
          isBookmarked: sql<boolean>`false`.as('isBookmarked'),
          price: exams.price,
          description: exams.description,
          createdAt: exams.createdAt,
          updatedAt: exams.updatedAt,
        })
        .from(exams)
        .leftJoin(vendors, eq(exams.vendorId, vendors.id))
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(exams.updatedAt))
        .all()
        
      // Transform to match frontend expectations
      return rawResults.map(exam => ({
        ...exam,
        examCode: exam.code,
        examName: exam.name,
        examDuration: exam.duration,
        numberOfQuestions: exam.questionCount || 0
      }))
    }, 300) // Cache for 5 minutes
    
    console.log(`[API] /api/exams - Found ${results.length} exams`)
    
    return {
      success: true,
      data: results,
      cached: true
    }
  } catch (error: any) {
    console.error('Error fetching exams:', error)
    
    // Don't expose internal errors to client
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch exams'
    })
  }
})