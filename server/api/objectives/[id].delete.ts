import { useDB } from '~/server/utils/db'
import { objectives, questions } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit, getClientIP, schemas, getSecurityHeaders, auditAPIEndpoint } from '~/server/utils/security'
import { invalidateCache } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  try {
    // Apply security headers
    for (const [header, value] of Object.entries(getSecurityHeaders())) {
      setHeader(event, header, value)
    }

    // Rate limiting for destructive operations (stricter)
    const clientIP = getClientIP(event)
    const rateLimit = checkRateLimit(`delete_${clientIP}`, 10, 60000) // 10 deletes per minute
    
    if (!rateLimit.allowed) {
      setHeader(event, 'X-RateLimit-Limit', '10')
      setHeader(event, 'X-RateLimit-Remaining', '0')
      setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many delete requests'
      })
    }

    setHeader(event, 'X-RateLimit-Limit', '10')
    setHeader(event, 'X-RateLimit-Remaining', rateLimit.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // TODO: Add admin role check
    // if (!session.user.role?.includes('admin')) {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: 'Admin access required'
    //   })
    // }

    const objectiveId = getRouterParam(event, 'id')

    if (!objectiveId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Objective ID is required'
      })
    }

    // Validate objective ID format
    if (!schemas.id.safeParse(objectiveId).success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid objective ID format'
      })
    }

    // Security audit
    const auditResult = auditAPIEndpoint('DELETE /api/objectives/[id]', { objectiveId })
    if (auditResult.issues.length > 0) {
      console.warn('Security audit issues:', auditResult)
    }

    const db = useDB()
    
    // Check if objective exists
    const existingObjective = await db
      .select()
      .from(objectives)
      .where(eq(objectives.id, objectiveId))
      .then(rows => rows[0])

    if (!existingObjective) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Objective not found'
      })
    }

    // Check if there are questions associated with this objective
    const associatedQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.objectiveId, objectiveId))

    if (associatedQuestions.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete objective. It has ${associatedQuestions.length} associated questions. Please reassign or delete the questions first.`
      })
    }

    // Delete the objective
    await db
      .delete(objectives)
      .where(eq(objectives.id, objectiveId))

    // Invalidate related caches
    invalidateCache.objective(objectiveId, existingObjective.examId)

    return {
      success: true,
      message: 'Objective deleted successfully'
    }

  } catch (error: any) {
    console.error('Delete objective error:', error)
    
    // Don't expose internal errors to client
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete objective'
    })
  }
})