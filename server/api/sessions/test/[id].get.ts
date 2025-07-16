import { z } from 'zod'
import { testSessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { requireAuth } from '~/server/utils/auth'

// Query parameter validation
const querySchema = z.object({
  includeQuestions: z.coerce.boolean().optional().default(false),
  includeResults: z.coerce.boolean().optional().default(false)
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
    const { includeQuestions, includeResults } = querySchema.parse(query)
    
    // Get session
    const session = await testSessionService.getById(sessionId)
    
    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Test session not found'
      })
    }
    
    // Verify ownership
    if (session.userId !== user.id && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to this session'
      })
    }
    
    // Calculate time remaining
    const now = Math.floor(Date.now() / 1000)
    const timeElapsed = now - session.startedAt
    const timeRemaining = Math.max(0, session.timeLimitSeconds - timeElapsed)
    
    // Prepare response data
    const responseData: any = {
      session: {
        ...session,
        timeRemainingSeconds: timeRemaining
      }
    }
    
    // Include questions if requested (without answers for active tests)
    if (includeQuestions) {
      const includeAnswers = session.status === 'submitted'
      const questions = await questionService.getByIds(
        session.questionsOrder,
        includeAnswers
      )
      responseData.questions = questions
    }
    
    // Include results if requested and test is submitted
    if (includeResults && session.status === 'submitted') {
      responseData.results = {
        score: session.score,
        passed: session.passed === 1,
        correctCount: session.correctCount,
        incorrectCount: session.incorrectCount,
        unansweredCount: session.unansweredCount,
        totalQuestions: session.totalQuestions,
        passingScore: session.passingScore,
        timeSpent: session.timeSpentSeconds
      }
    }
    
    console.log(`[Test Session] Retrieved session ${sessionId} for user ${user.id}`)
    
    return {
      success: true,
      data: responseData
    }
  } catch (error: any) {
    console.error('Failed to get test session:', error)
    
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
      statusMessage: error.message || 'Failed to retrieve test session'
    })
  }
})