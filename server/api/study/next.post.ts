import { eq, and, notInArray, sql } from 'drizzle-orm'
import { useDB } from '~/server/utils/db'
import { questions, studySessions, testResponses } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Get request body
    const body = await readBody(event)
    const { sessionId, excludeIds = [] } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    const db = useDB()

    // Get the study session
    const [studySession] = await db
      .select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id)
        )
      )
      .limit(1)

    if (!studySession) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Study session not found'
      })
    }

    // Build query to get next question
    let query = db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.examId, studySession.examId),
          eq(questions.isActive, true)
        )
      )

    // Exclude already answered questions
    if (excludeIds.length > 0) {
      query = query.where(notInArray(questions.id, excludeIds))
    }

    // Add randomization for variety
    const availableQuestions = await query

    if (availableQuestions.length === 0) {
      return {
        success: true,
        data: null,
        message: 'No more questions available'
      }
    }

    // Pick a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const nextQuestion = availableQuestions[randomIndex]

    // Parse options if stored as JSON
    if (nextQuestion.options && typeof nextQuestion.options === 'string') {
      try {
        nextQuestion.options = JSON.parse(nextQuestion.options)
      } catch (e) {
        console.error('Failed to parse question options:', e)
        nextQuestion.options = []
      }
    }

    return {
      success: true,
      data: {
        id: nextQuestion.id,
        questionText: nextQuestion.questionText,
        questionType: nextQuestion.questionType,
        options: nextQuestion.options || [],
        difficultyLevel: nextQuestion.difficultyLevel,
        // Don't send the answer yet
        hasExplanation: !!nextQuestion.explanation
      }
    }

  } catch (error: any) {
    console.error('Study next question error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get next question'
    })
  }
})