import { z } from 'zod'
import { studySessionService } from '~/server/utils/sessions'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const endSessionSchema = z.object({
  action: z.enum(['complete', 'abandon'])
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
    // Parse and validate request body
    const body = await readBody(event)
    const { action } = endSessionSchema.parse(body)
    
    // Get session to verify ownership
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
    
    // Check if session is already completed
    if (session.status === 'completed' || session.status === 'abandoned') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session has already ended'
      })
    }
    
    // End the session based on action
    if (action === 'complete') {
      await studySessionService.complete(sessionId)
    } else {
      await studySessionService.abandon(sessionId)
    }
    
    // Get final session state with statistics
    const finalSession = await studySessionService.getById(sessionId)
    
    // Calculate statistics
    const statistics = {
      totalQuestions: session.totalQuestions,
      questionsAnswered: Object.keys(session.answers).length,
      correctAnswers: Object.values(session.answers).filter((a: any) => a.isCorrect).length,
      incorrectAnswers: Object.values(session.answers).filter((a: any) => !a.isCorrect).length,
      skippedAnswers: session.totalQuestions - Object.keys(session.answers).length,
      accuracy: Object.keys(session.answers).length > 0
        ? (Object.values(session.answers).filter((a: any) => a.isCorrect).length / Object.keys(session.answers).length) * 100
        : 0,
      timeSpentSeconds: session.timeSpentSeconds,
      bookmarkedCount: session.bookmarks.length,
      flaggedCount: session.flags.length
    }
    
    console.log(`[Study Session] Ended session ${sessionId} for user ${user.id} with action: ${action}`)
    
    return {
      success: true,
      data: {
        session: finalSession,
        statistics
      }
    }
  } catch (error: any) {
    console.error('Failed to end study session:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }
    
    // Re-throw if it's already a proper error
    if (error.statusCode) throw error
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to end study session'
    })
  }
})