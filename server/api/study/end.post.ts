import { useDB } from '~/server/utils/db'
import { studySessions } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

interface EndSessionRequest {
  sessionId: string
  results: Record<string, {
    questionId: string
    selectedAnswers: number[]
    isCorrect: boolean
    timeSpent: number
    timestamp: string
  }>
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const body = await readBody<EndSessionRequest>(event)
  
  if (!body.sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  try {
    // Get current study session from user session
    const studySession = session.studySession
    
    if (!studySession || studySession.id !== body.sessionId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Study session not found'
      })
    }
    
    // Calculate session stats
    const totalQuestions = Object.keys(body.results).length
    const correctAnswers = Object.values(body.results).filter(r => r.isCorrect).length
    const incorrectAnswers = totalQuestions - correctAnswers
    const totalTimeSpent = Object.values(body.results).reduce((sum, r) => sum + r.timeSpent, 0)
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    
    // Update session data
    studySession.isCompleted = true
    studySession.completedAt = new Date().toISOString()
    studySession.correctAnswers = correctAnswers
    studySession.incorrectAnswers = incorrectAnswers
    studySession.totalTimeSeconds = totalTimeSpent
    studySession.answers = JSON.stringify(body.results)
    
    // Save to database if we have a sessions table
    const db = useDB()
    try {
      // Try to save session to database
      await db.insert(studySessions).values({
        id: studySession.id,
        userId: session.user.id,
        examId: studySession.examId,
        questionsAnswered: totalQuestions,
        correctAnswers: correctAnswers,
        totalTimeSeconds: totalTimeSpent,
        isActive: false
      }).onConflictDoUpdate({
        target: studySessions.id,
        set: {
          questionsAnswered: totalQuestions,
          correctAnswers: correctAnswers,
          totalTimeSeconds: totalTimeSpent,
          isActive: false,
          lastActivity: new Date().toISOString()
        }
      })
    } catch (dbError) {
      console.warn('Could not save session to database:', dbError)
      // Continue even if database save fails
    }
    
    // Clear study session from user session
    await setUserSession(event, {
      ...session,
      studySession: null
    })
    
    return {
      success: true,
      data: {
        sessionId: body.sessionId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        accuracy: Math.round(accuracy),
        totalTimeSpent
      }
    }
  } catch (error: any) {
    console.error('Error ending study session:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to end study session'
    })
  }
})