import { useDB } from '~/server/utils/db'
import { questions } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { updateProgressAfterStudy } from '~/server/utils/progressCalculations'

interface AnswerRequest {
  sessionId: string
  questionId: string
  selectedAnswers: number[]
  timeSpent?: number
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id || !session?.studySession) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Valid study session required'
    })
  }

  const body = await readBody<AnswerRequest>(event)
  const db = useDB()

  if (!body.questionId || !Array.isArray(body.selectedAnswers)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Question ID and selected answers are required'
    })
  }

  try {
    // Get the correct answer for this question
    const question = await db
      .select({
        id: questions.id,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        questionType: questions.questionType
      })
      .from(questions)
      .where(eq(questions.id, body.questionId))
      .get()

    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }

    // Parse correct answer
    let correctAnswer: number[] = []
    try {
      correctAnswer = question.correctAnswer ? JSON.parse(question.correctAnswer) : []
    } catch (e) {
      console.warn('Invalid JSON in correctAnswer field:', question.correctAnswer)
      correctAnswer = []
    }

    // Check if answer is correct
    const isCorrect = arraysEqual(body.selectedAnswers.sort(), correctAnswer.sort())

    // Update study session
    const studySession = session.studySession
    const answers = JSON.parse(studySession.answers || '{}')
    
    answers[body.questionId] = {
      selectedAnswers: body.selectedAnswers,
      isCorrect,
      timeSpent: body.timeSpent || 0,
      answeredAt: new Date().toISOString()
    }

    // Update session stats
    const updatedSession = {
      ...studySession,
      answers: JSON.stringify(answers),
      correctAnswers: isCorrect ? studySession.correctAnswers + 1 : studySession.correctAnswers,
      incorrectAnswers: !isCorrect ? studySession.incorrectAnswers + 1 : studySession.incorrectAnswers,
      currentQuestionIndex: studySession.currentQuestionIndex + 1
    }

    // Check if session is completed
    const questionIds = JSON.parse(studySession.questionIds)
    if (updatedSession.currentQuestionIndex >= questionIds.length) {
      updatedSession.isCompleted = true
      updatedSession.completedAt = new Date().toISOString()
    }

    // Save updated session
    await setUserSession(event, {
      ...session,
      studySession: updatedSession
    })

    // Get next question if not completed
    let nextQuestion = null
    if (!updatedSession.isCompleted) {
      const nextQuestionId = questionIds[updatedSession.currentQuestionIndex]
      if (nextQuestionId) {
        const nextQ = await db
          .select({
            id: questions.id,
            examId: questions.examId,
            questionText: questions.questionText,
            questionType: questions.questionType,
            options: questions.options,
            explanation: questions.explanation
          })
          .from(questions)
          .where(eq(questions.id, nextQuestionId))
          .get()

        if (nextQ) {
          try {
            nextQuestion = {
              ...nextQ,
              options: nextQ.options ? JSON.parse(nextQ.options) : []
            }
          } catch (e) {
            console.warn('Invalid JSON in options field:', nextQ.options)
            nextQuestion = {
              ...nextQ,
              options: []
            }
          }
        }
      }
    }

    return {
      success: true,
      data: {
        isCorrect,
        correctAnswer,
        explanation: question.explanation,
        isCompleted: updatedSession.isCompleted,
        progress: {
          current: updatedSession.currentQuestionIndex,
          total: questionIds.length,
          correct: updatedSession.correctAnswers,
          incorrect: updatedSession.incorrectAnswers,
          percentage: Math.round((updatedSession.correctAnswers / Math.max(1, updatedSession.currentQuestionIndex)) * 100)
        },
        nextQuestion
      }
    }

  } catch (error) {
    console.error('Error submitting answer:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit answer'
    })
  }
})

// Helper function to compare arrays
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
}