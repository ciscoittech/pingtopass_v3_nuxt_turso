import { z } from 'zod'
import { studySessionService } from '~/server/utils/sessions'
import { questionService } from '~/server/utils/questionService'
import { examService } from '~/server/utils/examService'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const startStudySessionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  mode: z.enum(['sequential', 'random', 'flagged', 'incorrect', 'weak_areas', 'review']).optional().default('sequential'),
  maxQuestions: z.number().int().min(1).max(500).optional(),
  objectiveIds: z.array(z.string()).optional(),
  showExplanations: z.boolean().optional().default(true),
  showTimer: z.boolean().optional().default(true),
  autoAdvance: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  console.log('[Study API] Start session endpoint called')
  const user = await requireAuth(event)
  console.log('[Study API] User authenticated:', user.id)
  
  try {
    // Parse and validate request body
    const body = await readBody(event)
    console.log('[Study API] Request body:', body)
    const params = startStudySessionSchema.parse(body)
    console.log('[Study API] Parsed params:', params)
    
    // Verify exam exists and is accessible
    console.log('[Study API] Fetching exam:', params.examId)
    const exam = await examService.getById(params.examId, user.id)
    console.log('[Study API] Exam found:', exam ? 'Yes' : 'No', exam)
    
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
    
    // Check for existing active session
    const existingSession = await studySessionService.getActive(user.id, params.examId)
    
    if (existingSession) {
      console.log(`[Study Session] Resuming existing session ${existingSession.id} for user ${user.id}`)
      
      // Get questions in the original order
      const questions = await questionService.getByIds(
        existingSession.questionsOrder,
        true // Include answers for study mode
      )
      
      return {
        success: true,
        data: {
          session: existingSession,
          questions,
          isResuming: true
        }
      }
    }
    
    // Get questions based on mode
    let questions = []
    console.log('[Study API] Getting questions for mode:', params.mode)
    
    if (params.mode === 'review') {
      // Get all previously answered questions for review
      questions = await questionService.getAnsweredQuestionsForUser(
        params.examId,
        user.id,
        {
          maxQuestions: params.maxQuestions,
          includeAnswers: true
        }
      )
    } else if (params.mode === 'flagged') {
      // Get flagged questions from previous sessions
      questions = await questionService.getFlaggedQuestionsForUser(
        params.examId,
        user.id,
        {
          maxQuestions: params.maxQuestions,
          includeAnswers: true
        }
      )
    } else if (params.mode === 'incorrect') {
      // Get incorrectly answered questions
      questions = await questionService.getIncorrectQuestionsForUser(
        params.examId,
        user.id,
        {
          maxQuestions: params.maxQuestions,
          includeAnswers: true
        }
      )
    } else {
      // Standard mode - get questions for new session
      console.log('[Study API] Getting questions with options:', {
        examId: params.examId,
        maxQuestions: params.maxQuestions,
        objectiveIds: params.objectiveIds,
        mode: params.mode
      })
      
      questions = await questionService.getQuestionsForSession(
        params.examId,
        'study',
        {
          maxQuestions: params.maxQuestions,
          objectiveIds: params.objectiveIds,
          shuffleQuestions: params.mode === 'random',
          shuffleOptions: false // Don't shuffle in study mode
        }
      )
    }
    
    console.log('[Study API] Questions retrieved:', questions.length)
    
    if (questions.length === 0) {
      console.error('[Study API] No questions found for exam:', params.examId)
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }
    
    // Create new session
    const session = await studySessionService.create({
      userId: user.id,
      examId: params.examId,
      mode: params.mode,
      questionIds: questions.map(q => q.id),
      maxQuestions: params.maxQuestions,
      showExplanations: params.showExplanations,
      showTimer: params.showTimer,
      autoAdvance: params.autoAdvance
    })
    
    console.log(`[Study Session] Created new session ${session.id} for user ${user.id} with ${questions.length} questions`)
    console.log('[Study API] Returning response with:', {
      sessionId: session.id,
      questionsCount: questions.length,
      firstQuestion: questions[0]?.id
    })
    
    return {
      success: true,
      data: {
        session,
        questions,
        isResuming: false
      }
    }
    
  } catch (error: any) {
    console.error('Failed to start study session:', error)
    
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
      statusMessage: error.message || 'Failed to start study session'
    })
  }
})