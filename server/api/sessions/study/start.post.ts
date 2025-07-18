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
      // Parse questionsOrder as it's stored as JSON string
      let questionIds: string[]
      try {
        questionIds = JSON.parse(existingSession.questionsOrder)
        if (!Array.isArray(questionIds)) {
          throw new Error('questionsOrder is not an array')
        }
      } catch (e) {
        console.error('[Study API] Failed to parse questionsOrder:', existingSession.questionsOrder, e)
        throw createError({
          statusCode: 500,
          statusMessage: 'Invalid session data: could not parse questions order'
        })
      }
      
      const questions = await questionService.getByIds(
        questionIds,
        true // Include answers for study mode
      )
      
      console.log(`[Study API] Resuming session with ${questions.length} questions (expected ${existingSession.totalQuestions})`)
      
      // Check if we have all the questions we need
      if (questions.length !== existingSession.totalQuestions || questions.length === 0) {
        console.warn(`[Study API] Question count mismatch: got ${questions.length}, expected ${existingSession.totalQuestions}`)
        console.log('[Study API] Abandoning incomplete session and creating new one')
        
        // Abandon the incomplete session
        await studySessionService.abandon(existingSession.id)
        
        // Continue to create a new session below
      } else {
        // Session is valid, return it
        return {
          success: true,
          data: {
            session: existingSession,
            questions,
            isResuming: true
          }
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
      
      console.log('[Study API] questionService:', questionService)
      console.log('[Study API] questionService.getQuestionsForSession:', questionService?.getQuestionsForSession)
      
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
    
    console.log('[Study API] Questions retrieved:', questions)
    console.log('[Study API] Questions type:', typeof questions)
    console.log('[Study API] Questions is array:', Array.isArray(questions))
    console.log('[Study API] Questions length:', questions?.length)
    
    // Ensure questions is an array
    if (!Array.isArray(questions)) {
      console.error('[Study API] Questions is not an array:', questions)
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid question format returned from service'
      })
    }
    
    if (questions.length === 0) {
      console.error('[Study API] No questions found for exam:', params.examId)
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this exam'
      })
    }
    
    // Create new session
    console.log('[Study API] Creating session with questions:', {
      questionsCount: questions.length,
      questionsType: typeof questions,
      isArray: Array.isArray(questions),
      firstQuestionId: questions[0]?.id
    })
    
    // Double-check questions is an array before mapping
    if (!Array.isArray(questions)) {
      console.error('[Study API] Questions is not an array before create:', questions)
      throw createError({
        statusCode: 500,
        statusMessage: 'Questions data is invalid'
      })
    }
    
    console.log('[Study API] Before mapping - questions:', questions)
    console.log('[Study API] Before mapping - first question:', questions[0])
    
    // Additional safety check
    if (!Array.isArray(questions)) {
      console.error('[Study API] Questions is not an array before mapping:', questions)
      throw createError({
        statusCode: 500,
        statusMessage: 'Questions data is not in expected format'
      })
    }
    
    let questionIds
    try {
      if (!questions || !Array.isArray(questions)) {
        console.error('[Study API] Questions is not valid for mapping:', questions)
        throw new Error('Questions data is not valid for mapping')
      }
      
      questionIds = questions.map(q => {
        if (!q || typeof q !== 'object' || !q.id) {
          console.error('[Study API] Invalid question object:', q)
          throw new Error('Invalid question object found')
        }
        return q.id
      })
      console.log('[Study API] Question IDs:', questionIds)
      console.log('[Study API] Question IDs type:', typeof questionIds)
      console.log('[Study API] Question IDs is array:', Array.isArray(questionIds))
    } catch (mapError: any) {
      console.error('[Study API] Error mapping question IDs:', mapError)
      console.error('[Study API] Questions value that caused error:', questions)
      console.error('[Study API] Error message:', mapError.message)
      console.error('[Study API] Error stack:', mapError.stack)
      throw createError({
        statusCode: 500,
        statusMessage: mapError.message || 'Failed to process questions data'
      })
    }
    
    let session
    try {
      session = await studySessionService.create({
        userId: user.id,
        examId: params.examId,
        mode: params.mode,
        questionIds: questionIds,
        maxQuestions: params.maxQuestions,
        showExplanations: params.showExplanations,
        showTimer: params.showTimer,
        autoAdvance: params.autoAdvance
      })
    } catch (sessionError: any) {
      console.error('[Study API] Error creating session:', sessionError)
      console.error('[Study API] Error message:', sessionError.message)
      console.error('[Study API] Error stack:', sessionError.stack)
      throw createError({
        statusCode: 500,
        statusMessage: sessionError.message || 'Failed to create study session'
      })
    }
    
    console.log(`[Study Session] Created new session ${session.id} for user ${user.id} with ${questions.length} questions`)
    
    // Validate questions before returning
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('[Study API] Critical: Questions array is invalid before return:', {
        isArray: Array.isArray(questions),
        length: questions?.length,
        type: typeof questions
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to prepare questions for session'
      })
    }
    
    // Create response object
    const responseData = {
      session,
      questions: [...questions], // Clone array to avoid reference issues
      isResuming: false
    }
    
    console.log('[Study API] Final response validation:', {
      sessionId: responseData.session.id,
      questionsInResponse: Array.isArray(responseData.questions),
      questionsCount: responseData.questions.length,
      firstQuestionId: responseData.questions[0]?.id,
      lastQuestionId: responseData.questions[responseData.questions.length - 1]?.id
    })
    
    return {
      success: true,
      data: responseData
    }
    
  } catch (error: any) {
    console.error('[Study API] ===== ERROR IN START SESSION =====')
    console.error('[Study API] Error object:', error)
    console.error('[Study API] Error message:', error.message)
    console.error('[Study API] Error stack:', error.stack)
    console.error('[Study API] Error name:', error.name)
    console.error('[Study API] Error constructor:', error.constructor?.name)
    console.error('[Study API] ===== END ERROR =====')
    
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