import { useDB } from '~/server/utils/db'
import { testSessions, questions, exams } from '~/server/database/schema'
import { eq, inArray } from 'drizzle-orm'

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

    // Get session ID from route params
    const sessionId = getRouterParam(event, 'id')
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    const userId = session.user.id

    // Get test session with exam details
    const testSession = await db
      .select({
        testSession: testSessions,
        exam: exams
      })
      .from(testSessions)
      .innerJoin(exams, eq(testSessions.examId, exams.id))
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

    const { testSession: session_data, exam } = testSession

    if (session_data.status !== 'submitted') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Test has not been submitted yet'
      })
    }

    // Get query parameters for detailed results
    const query = getQuery(event)
    const includeDetailedResults = query.detailed === 'true'

    // Base response
    const response = {
      success: true,
      data: {
        sessionId: session_data.id,
        exam: {
          id: exam.id,
          name: exam.name,
          code: exam.code,
          description: exam.description
        },
        results: {
          totalScore: session_data.totalScore,
          maxPossibleScore: session_data.maxPossibleScore,
          scorePercentage: Math.round((session_data.totalScore! / session_data.maxPossibleScore!) * 100),
          correctAnswers: session_data.correctAnswers,
          incorrectAnswers: session_data.incorrectAnswers,
          skippedAnswers: session_data.skippedAnswers,
          hasPassed: session_data.hasPassed,
          passPercentage: session_data.passPercentage,
          timeSpent: session_data.timeSpent,
          timeLimit: session_data.timeLimit,
          submittedAt: session_data.submittedAt,
          sectionScores: session_data.sectionScores ? JSON.parse(session_data.sectionScores) : {}
        },
        detailedResults: null as any
      }
    }

    // Include detailed question-by-question results if requested
    if (includeDetailedResults) {
      const questionIds = JSON.parse(session_data.questionIds)
      const userAnswers = JSON.parse(session_data.answers || '{}')
      const reviewFlags = JSON.parse(session_data.reviewFlags || '{}')

      // Get all questions with their details
      const testQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, questionIds))

      const detailedResults = testQuestions.map((question, index) => {
        const userSelectedAnswers = userAnswers[question.id] || []
        const correctAnswer = question.correctAnswer ? JSON.parse(question.correctAnswer) : []
        const isCorrect = arraysEqual(userSelectedAnswers.sort(), correctAnswer.sort())
        const wasReviewed = reviewFlags[question.id] || false

        return {
          questionNumber: index + 1,
          question: {
            id: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options ? JSON.parse(question.options) : [],
            explanation: question.explanation,
            difficultyLevel: question.difficultyLevel
          },
          userAnswers: userSelectedAnswers,
          correctAnswers: correctAnswer,
          isCorrect,
          wasReviewed,
          wasSkipped: userSelectedAnswers.length === 0
        }
      })

      response.data.detailedResults = detailedResults
    }

    return response

  } catch (error) {
    console.error('Get test results error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper function to compare arrays
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
}