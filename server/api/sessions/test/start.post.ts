import { z } from 'zod'
import { testSessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { examService } from '~/server/utils/examService'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const startTestSessionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  timeLimitMinutes: z.number().int().min(1).max(480).optional(), // Max 8 hours
  maxQuestions: z.number().int().min(1).max(200).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  try {
    // Parse and validate request body
    const body = await readBody(event)
    const params = startTestSessionSchema.parse(body)
    
    // Verify exam exists and is accessible
    const exam = await examService.getById(params.examId, user.id)
    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }
    
    if (!exam.isActive && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'This exam is not currently available'
      })
    }
    
    // Check for existing active test session
    const existingSession = await testSessionService.getActive(user.id, params.examId)
    
    if (existingSession) {
      // Check if session has expired
      const now = Math.floor(Date.now() / 1000)
      const timeElapsed = now - existingSession.startedAt
      const timeRemaining = existingSession.timeLimitSeconds - timeElapsed
      
      if (timeRemaining <= 0) {
        // Auto-submit expired session
        await testSessionService.submit(existingSession.id)
        console.log(`[Test Session] Auto-submitted expired session ${existingSession.id}`)
      } else {
        // Resume existing session
        console.log(`[Test Session] Resuming existing session ${existingSession.id} for user ${user.id}`)
        
        // Get questions without answers for test mode
        const questions = await questionService.getByIds(
          existingSession.questionsOrder,
          false // No answers in test mode
        )
        
        return {
          success: true,
          data: {
            session: {
              ...existingSession,
              timeRemainingSeconds: timeRemaining
            },
            questions,
            isResuming: true
          }
        }
      }
    }
    
    // Determine time limit and question count
    const timeLimitMinutes = params.timeLimitMinutes || exam.duration || 90
    const maxQuestions = params.maxQuestions || exam.totalQuestions || 75
    
    // Get questions for new test session
    const questions = await questionService.getQuestionsForSession(
      params.examId,
      'test',
      {
        maxQuestions,
        shuffleQuestions: true, // Always shuffle for tests
        shuffleOptions: true    // Shuffle answer options
      }
    )
    
    if (questions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }
    
    // Create new test session
    const session = await testSessionService.create({
      userId: user.id,
      examId: params.examId,
      timeLimitSeconds: timeLimitMinutes * 60,
      totalQuestions: questions.length,
      questionsOrder: questions.map(q => q.id),
      passingScore: exam.passingScore || 70,
      metadata: {
        examName: exam.name,
        examCode: exam.code,
        vendorName: exam.vendor.name
      }
    })
    
    console.log(`[Test Session] Created new session ${session.id} for user ${user.id} with ${questions.length} questions`)
    
    return {
      success: true,
      data: {
        session: {
          ...session,
          timeRemainingSeconds: session.timeLimitSeconds
        },
        questions,
        isResuming: false
      }
    }
  } catch (error: any) {
    console.error('Failed to start test session:', error)
    
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
      statusMessage: error.message || 'Failed to start test session'
    })
  }
})