import { z } from 'zod'
import { studySessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { requireAuth } from '~/server/utils/auth'

// Query parameter validation
const querySchema = z.object({
  includeQuestions: z.coerce.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const sessionId = getRouterParam(event, 'id')
  
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }
  
  try {
    // Parse query parameters
    const query = getQuery(event)
    const { includeQuestions } = querySchema.parse(query)
    
    // Get session
    const session = await studySessionService.getById(sessionId)
    
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Study session not found'
      })
    }
    
    // Verify ownership
    if (session.userId !== user.id && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to this session'
      })
    }
    
    // Prepare response data
    const responseData: any = {
      session
    }
    
    // Include questions if requested
    if (includeQuestions) {
      const questions = await questionService.getByIds(
        session.questionsOrder,
        true // Include answers for study mode
      )
      responseData.questions = questions
    }
    
    console.log(`[Study Session] Retrieved session ${sessionId} for user ${user.id}`)
    
    return {
      success: true,
      data: responseData
    }
  } catch (error: any) {
    console.error('Failed to get study session:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to retrieve study session'
    })
  }
})