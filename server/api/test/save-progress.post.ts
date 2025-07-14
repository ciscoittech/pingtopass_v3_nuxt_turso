import { z } from 'zod'
import { useDB } from '~/server/utils/db'
import { testSessions, questions } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

const saveProgressSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  currentQuestionIndex: z.number().min(0),
  answers: z.record(z.array(z.number())), // { questionId: [selectedAnswers] }
  reviewFlags: z.record(z.boolean()).optional(),
  timeRemaining: z.number().min(0)
})

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Validate request body
    const body = await readBody(event)
    const validatedData = saveProgressSchema.parse(body)

    const userId = session.user.id
    const { sessionId, currentQuestionIndex, answers, reviewFlags, timeRemaining } = validatedData

    // Get test session
    const testSession = await db
      .select()
      .from(testSessions)
      .where(
        eq(testSessions.id, sessionId) &&
        eq(testSessions.userId, userId)
      )
      .get()

    if (!testSession) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Test session not found'
      })
    }

    if (testSession.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Test session is not active'
      })
    }

    // Check if time has expired
    if (timeRemaining <= 0) {
      // Auto-submit the test
      await db
        .update(testSessions)
        .set({
          status: 'expired',
          timeRemaining: 0,
          submittedAt: Math.floor(Date.now() / 1000),
          answers: JSON.stringify(answers),
          reviewFlags: JSON.stringify(reviewFlags || {}),
          currentQuestionIndex,
          updatedAt: Math.floor(Date.now() / 1000)
        })
        .where(eq(testSessions.id, sessionId))

      return {
        success: true,
        data: {
          sessionId,
          status: 'expired',
          message: 'Test has expired and been auto-submitted'
        }
      }
    }

    // Update test session progress
    await db
      .update(testSessions)
      .set({
        currentQuestionIndex,
        answers: JSON.stringify(answers),
        reviewFlags: JSON.stringify(reviewFlags || {}),
        timeRemaining,
        updatedAt: Math.floor(Date.now() / 1000)
      })
      .where(eq(testSessions.id, sessionId))

    // Get current question if needed
    const questionIds = JSON.parse(testSession.questionIds)
    const currentQuestionId = questionIds[currentQuestionIndex]
    
    let currentQuestion = null
    if (currentQuestionId && currentQuestionIndex < questionIds.length) {
      currentQuestion = await db
        .select()
        .from(questions)
        .where(eq(questions.id, currentQuestionId))
        .get()
    }

    return {
      success: true,
      data: {
        sessionId,
        currentQuestionIndex,
        timeRemaining,
        status: 'active',
        totalQuestions: testSession.totalQuestions,
        answeredQuestions: Object.keys(answers).length,
        currentQuestion: currentQuestion ? {
          id: currentQuestion.id,
          questionText: currentQuestion.questionText,
          questionType: currentQuestion.questionType,
          options: currentQuestion.options ? JSON.parse(currentQuestion.options) : [],
          examId: currentQuestion.examId,
          difficultyLevel: currentQuestion.difficultyLevel
        } : null
      }
    }

  } catch (error) {
    console.error('Save test progress error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})