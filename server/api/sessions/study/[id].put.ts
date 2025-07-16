import { z } from 'zod'
import { studySessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const updateStudySessionSchema = z.object({
  currentQuestionIndex: z.number().int().min(0).optional(),
  answer: z.object({
    questionId: z.string(),
    selectedAnswers: z.array(z.number()),
    isCorrect: z.boolean(),
    timeSpent: z.number().int().min(0)
  }).optional(),
  bookmark: z.object({
    questionId: z.string(),
    action: z.enum(['add', 'remove'])
  }).optional(),
  flag: z.object({
    questionId: z.string(),
    action: z.enum(['add', 'remove'])
  }).optional(),
  timeSpentSeconds: z.number().int().min(0).optional()
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
    const updates = updateStudySessionSchema.parse(body)
    
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
    
    // Check if session is still active
    if (session.status !== 'active' && session.status !== 'paused') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot update a completed or abandoned session'
      })
    }
    
    // Process answer submission
    if (updates.answer) {
      const { questionId, selectedAnswers, timeSpent } = updates.answer
      
      // Validate the answer
      const question = await questionService.getById(questionId, true)
      if (!question) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Question not found'
        })
      }
      
      const isCorrect = questionService.validateAnswer(question, selectedAnswers)
      
      // Update progress
      await studySessionService.updateProgress(sessionId, {
        answer: {
          questionId,
          selectedAnswers,
          isCorrect,
          timeSpent,
          answeredAt: new Date().toISOString()
        }
      })
    }
    
    // Process bookmark toggle
    if (updates.bookmark) {
      const { questionId, action } = updates.bookmark
      await studySessionService.updateProgress(sessionId, {
        bookmark: { questionId, action }
      })
    }
    
    // Process flag toggle
    if (updates.flag) {
      const { questionId, action } = updates.flag
      await studySessionService.updateProgress(sessionId, {
        flag: { questionId, action }
      })
    }
    
    // Update current question index
    if (updates.currentQuestionIndex !== undefined) {
      await studySessionService.updateProgress(sessionId, {
        currentQuestionIndex: updates.currentQuestionIndex
      })
    }
    
    // Update time spent
    if (updates.timeSpentSeconds !== undefined) {
      await studySessionService.updateProgress(sessionId, {
        timeSpentSeconds: updates.timeSpentSeconds
      })
    }
    
    // Get updated session
    const updatedSession = await studySessionService.getById(sessionId)
    
    console.log(`[Study Session] Updated session ${sessionId} for user ${user.id}`)
    
    return {
      success: true,
      data: {
        session: updatedSession
      }
    }
  } catch (error: any) {
    console.error('Failed to update study session:', error)
    
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
      statusMessage: error.message || 'Failed to update study session'
    })
  }
})