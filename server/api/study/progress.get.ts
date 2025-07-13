import { useDB } from '~/server/utils/db'
import { questions } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id || !session?.studySession) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Valid study session required'
    })
  }

  try {
    const studySession = session.studySession
    const questionIds = JSON.parse(studySession.questionIds || '[]')
    const answers = JSON.parse(studySession.answers || '{}')
    
    // Calculate detailed progress
    const progress = {
      sessionId: studySession.id,
      examId: studySession.examId,
      studyMode: studySession.studyMode,
      current: studySession.currentQuestionIndex,
      total: studySession.totalQuestions,
      correct: studySession.correctAnswers,
      incorrect: studySession.incorrectAnswers,
      skipped: studySession.skippedAnswers,
      percentage: Math.round((studySession.correctAnswers / Math.max(1, studySession.currentQuestionIndex)) * 100),
      isCompleted: studySession.isCompleted,
      startedAt: studySession.startedAt,
      completedAt: studySession.completedAt || null,
      timeSpent: studySession.completedAt 
        ? new Date(studySession.completedAt).getTime() - new Date(studySession.startedAt).getTime()
        : Date.now() - new Date(studySession.startedAt).getTime(),
      answeredQuestions: Object.keys(answers).length,
      unansweredQuestions: questionIds.length - Object.keys(answers).length
    }

    // Get current question if session is active
    let currentQuestion = null
    if (!studySession.isCompleted && studySession.currentQuestionIndex < questionIds.length) {
      const currentQuestionId = questionIds[studySession.currentQuestionIndex]
      
      if (currentQuestionId) {
        const db = useDB()
        const question = await db
          .select({
            id: questions.id,
            examId: questions.examId,
            questionText: questions.questionText,
            questionType: questions.questionType,
            options: questions.options,
            explanation: questions.explanation
          })
          .from(questions)
          .where(eq(questions.id, currentQuestionId))
          .get()

        if (question) {
          try {
            currentQuestion = {
              ...question,
              options: question.options ? JSON.parse(question.options) : []
            }
          } catch (e) {
            console.warn('Invalid JSON in options field:', question.options)
            currentQuestion = {
              ...question,
              options: []
            }
          }
        }
      }
    }

    // Get session summary if completed
    let sessionSummary = null
    if (studySession.isCompleted) {
      const correctAnswers = Object.values(answers).filter((a: any) => a.isCorrect).length
      const totalAnswered = Object.keys(answers).length
      
      sessionSummary = {
        score: Math.round((correctAnswers / totalAnswered) * 100),
        totalQuestions: questionIds.length,
        answeredQuestions: totalAnswered,
        correctAnswers,
        incorrectAnswers: totalAnswered - correctAnswers,
        timeSpent: progress.timeSpent,
        averageTimePerQuestion: Math.round(progress.timeSpent / totalAnswered),
        passed: (correctAnswers / totalAnswered) >= 0.7 // 70% pass rate
      }
    }

    return {
      success: true,
      data: {
        progress,
        currentQuestion,
        sessionSummary
      }
    }

  } catch (error) {
    console.error('Error fetching study progress:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch study progress'
    })
  }
})