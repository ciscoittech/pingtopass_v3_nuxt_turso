import { z } from 'zod'
import { db } from '~/server/database/db'
import { testSessions, questions } from '~/server/database/schema'
import { eq, inArray } from 'drizzle-orm'

const submitTestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  answers: z.record(z.array(z.number())), // { questionId: [selectedAnswers] }
  reviewFlags: z.record(z.boolean()).optional(),
  timeSpent: z.number().min(0),
  isAutoSubmit: z.boolean().optional() // true if submitted by timer
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
    const validatedData = submitTestSchema.parse(body)

    const userId = session.user.id
    const { sessionId, answers, reviewFlags, timeSpent, isAutoSubmit } = validatedData

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

    // Get all questions for the test
    const questionIds = JSON.parse(testSession.questionIds)
    const testQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds))

    if (testQuestions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No questions found for this test'
      })
    }

    // Calculate results
    let correctAnswers = 0
    let incorrectAnswers = 0
    let skippedAnswers = 0
    let totalScore = 0
    const maxPossibleScore = testQuestions.length

    // Section scores tracking
    const sectionScores: Record<string, { correct: number; total: number; percentage: number }> = {}

    testQuestions.forEach((question) => {
      const userAnswers = answers[question.id] || []
      const correctAnswer = question.correctAnswer ? JSON.parse(question.correctAnswer) : []
      
      // Check if answer is correct
      const isCorrect = arraysEqual(userAnswers.sort(), correctAnswer.sort())
      
      if (userAnswers.length === 0) {
        skippedAnswers++
      } else if (isCorrect) {
        correctAnswers++
        totalScore++
      } else {
        incorrectAnswers++
      }

      // Track section scores (if question has section/objective)
      // For now, we'll group by exam since objectives might not be implemented
      const sectionKey = question.examId
      if (!sectionScores[sectionKey]) {
        sectionScores[sectionKey] = { correct: 0, total: 0, percentage: 0 }
      }
      sectionScores[sectionKey].total++
      if (isCorrect) {
        sectionScores[sectionKey].correct++
      }
    })

    // Calculate section percentages
    Object.keys(sectionScores).forEach(sectionKey => {
      const section = sectionScores[sectionKey]
      section.percentage = Math.round((section.correct / section.total) * 100)
    })

    // Calculate pass/fail (assuming 70% is pass)
    const passPercentage = 70
    const scorePercentage = Math.round((totalScore / maxPossibleScore) * 100)
    const hasPassed = scorePercentage >= passPercentage

    // Update test session with results
    const timestamp = Math.floor(Date.now() / 1000)
    await db
      .update(testSessions)
      .set({
        status: 'submitted',
        submittedAt: timestamp,
        timeSpent,
        timeRemaining: Math.max(0, testSession.timeLimit - timeSpent),
        answers: JSON.stringify(answers),
        reviewFlags: JSON.stringify(reviewFlags || {}),
        totalScore,
        maxPossibleScore,
        correctAnswers,
        incorrectAnswers,
        skippedAnswers,
        passPercentage,
        hasPassed,
        sectionScores: JSON.stringify(sectionScores),
        updatedAt: timestamp
      })
      .where(eq(testSessions.id, sessionId))

    return {
      success: true,
      data: {
        sessionId,
        results: {
          totalScore,
          maxPossibleScore,
          scorePercentage,
          correctAnswers,
          incorrectAnswers,
          skippedAnswers,
          hasPassed,
          passPercentage,
          timeSpent,
          sectionScores,
          isAutoSubmit: isAutoSubmit || false,
          submittedAt: timestamp
        }
      }
    }

  } catch (error) {
    console.error('Submit test error:', error)
    
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

// Helper function to compare arrays
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
}