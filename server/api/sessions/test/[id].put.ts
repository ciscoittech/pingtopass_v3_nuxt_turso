import { z } from 'zod'
import { testSessionService } from '~/server/utils/sessions'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const updateTestSessionSchema = z.object({
  currentQuestionIndex: z.number().int().min(0).optional(),
  answer: z.object({
    questionIndex: z.number().int().min(0),
    selectedAnswers: z.array(z.number())
  }).optional(),
  flag: z.object({
    questionIndex: z.number().int().min(0),
    flagged: z.boolean()
  }).optional(),
  timeRemainingSeconds: z.number().int().min(0).optional()
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
    const updates = updateTestSessionSchema.parse(body)
    
    // Get session to verify ownership and status
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
    
    // Check if session is still active
    if (session.status !== 'active' && session.status !== 'paused') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot update a submitted or expired test session'
      })
    }
    
    // Check if session has expired
    const now = Math.floor(Date.now() / 1000)
    const timeElapsed = now - session.startedAt
    const currentTimeRemaining = session.timeLimitSeconds - timeElapsed
    
    if (currentTimeRemaining <= 0) {
      // Auto-submit expired session
      await testSessionService.submit(sessionId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Test session has expired and was automatically submitted'
      })
    }
    
    // Process answer submission
    if (updates.answer) {
      const { questionIndex, selectedAnswers } = updates.answer
      
      // Validate question index
      if (questionIndex >= session.totalQuestions) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid question index'
        })
      }
      
      // Get question ID from order
      const questionId = session.questionsOrder[questionIndex]
      
      // Save answer (without validation - that happens on submit)
      await testSessionService.saveAnswer(sessionId, {
        questionId,
        questionIndex,
        selectedAnswers,
        timeSpent: 0 // Can be calculated from timestamps
      })
    }
    
    // Process flag toggle
    if (updates.flag) {
      const { questionIndex, flagged } = updates.flag
      
      // Validate question index
      if (questionIndex >= session.totalQuestions) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid question index'
        })
      }
      
      const questionId = session.questionsOrder[questionIndex]
      
      await testSessionService.updateProgress(sessionId, {
        flag: {
          questionId,
          questionIndex,
          flagged
        }
      })
    }
    
    // Update current question index
    if (updates.currentQuestionIndex !== undefined) {
      if (updates.currentQuestionIndex >= session.totalQuestions) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid question index'
        })
      }
      
      await testSessionService.updateProgress(sessionId, {
        currentQuestionIndex: updates.currentQuestionIndex
      })
    }
    
    // Update time remaining (client-side time sync)
    if (updates.timeRemainingSeconds !== undefined) {
      // Validate time remaining is reasonable
      const serverTimeRemaining = session.timeLimitSeconds - timeElapsed
      const timeDiff = Math.abs(serverTimeRemaining - updates.timeRemainingSeconds)
      
      // Allow up to 30 seconds of drift
      if (timeDiff > 30) {
        console.warn(`[Test Session] Large time drift detected: ${timeDiff}s for session ${sessionId}`)
      }
      
      // Use server time as source of truth
      await testSessionService.updateProgress(sessionId, {
        lastActivityAt: now
      })
    }
    
    // Get updated session
    const updatedSession = await testSessionService.getById(sessionId)
    
    // Calculate current time remaining
    const finalTimeRemaining = updatedSession.timeLimitSeconds - (now - updatedSession.startedAt)
    
    console.log(`[Test Session] Updated session ${sessionId} for user ${user.id}`)
    
    return {
      success: true,
      data: {
        session: {
          ...updatedSession,
          timeRemainingSeconds: Math.max(0, finalTimeRemaining)
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to update test session:', error)
    
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
      statusMessage: error.message || 'Failed to update test session'
    })
  }
})