import { requireAuth } from '~/server/utils/auth'
import { useDB } from '~/server/utils/db'
import { studySessions, testSessions, exams } from '~/server/database/schema'
import { eq, desc, or, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDB()
  
  try {
    // Get the most recent study or test session
    const [lastStudySession] = await db
      .select({
        id: studySessions.id,
        examId: studySessions.examId,
        examCode: exams.code,
        examName: exams.name,
        status: studySessions.status,
        mode: studySessions.mode,
        totalQuestions: studySessions.totalQuestions,
        currentQuestionIndex: studySessions.currentQuestionIndex,
        answers: studySessions.answers,
        lastActivityAt: studySessions.lastActivityAt,
        timeSpentSeconds: studySessions.timeSpentSeconds
      })
      .from(studySessions)
      .leftJoin(exams, eq(studySessions.examId, exams.id))
      .where(
        and(
          eq(studySessions.userId, user.id),
          or(
            eq(studySessions.status, 'active'),
            eq(studySessions.status, 'paused')
          )
        )
      )
      .orderBy(desc(studySessions.lastActivityAt))
      .limit(1)
    
    // Also check for test sessions
    const [lastTestSession] = await db
      .select({
        id: testSessions.id,
        examId: testSessions.examId,
        examCode: exams.code,
        examName: exams.name,
        status: testSessions.status,
        totalQuestions: testSessions.totalQuestions,
        currentQuestionIndex: testSessions.currentQuestionIndex,
        answers: testSessions.answers,
        lastActivityAt: testSessions.lastActivityAt
      })
      .from(testSessions)
      .leftJoin(exams, eq(testSessions.examId, exams.id))
      .where(
        and(
          eq(testSessions.userId, user.id),
          eq(testSessions.status, 'active')
        )
      )
      .orderBy(desc(testSessions.lastActivityAt))
      .limit(1)
    
    // Determine which session is more recent
    let lastSession = null
    let mode: 'study' | 'test' = 'study'
    
    if (lastStudySession && lastTestSession) {
      if (lastStudySession.lastActivityAt > lastTestSession.lastActivityAt) {
        lastSession = lastStudySession
        mode = 'study'
      } else {
        lastSession = lastTestSession
        mode = 'test'
      }
    } else if (lastStudySession) {
      lastSession = lastStudySession
      mode = 'study'
    } else if (lastTestSession) {
      lastSession = lastTestSession
      mode = 'test'
    }
    
    if (!lastSession) {
      // Try to get the most recent completed session for stats
      const [completedSession] = await db
        .select({
          examId: studySessions.examId,
          examCode: exams.code,
          examName: exams.name,
          lastActivityAt: studySessions.lastActivityAt,
          answers: studySessions.answers,
          totalQuestions: studySessions.totalQuestions
        })
        .from(studySessions)
        .leftJoin(exams, eq(studySessions.examId, exams.id))
        .where(eq(studySessions.userId, user.id))
        .orderBy(desc(studySessions.lastActivityAt))
        .limit(1)
      
      if (completedSession) {
        const answers = JSON.parse(completedSession.answers || '{}')
        const questionsAnswered = Object.keys(answers).length
        const correctAnswers = Object.values(answers).filter((a: any) => a.isCorrect).length
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0
        const progress = Math.round((questionsAnswered / completedSession.totalQuestions) * 100)
        
        return {
          success: true,
          data: {
            examId: completedSession.examId,
            examCode: completedSession.examCode,
            examName: completedSession.examName,
            lastStudiedAt: completedSession.lastActivityAt,
            questionsAnswered,
            accuracy,
            progress,
            mode: 'study'
          }
        }
      }
      
      return {
        success: true,
        data: null
      }
    }
    
    // Calculate session stats
    const answers = JSON.parse(lastSession.answers || '{}')
    const questionsAnswered = Object.keys(answers).length
    const correctAnswers = Object.values(answers).filter((a: any) => a.isCorrect).length
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0
    const progress = Math.round(((lastSession.currentQuestionIndex || 0) / lastSession.totalQuestions) * 100)
    
    return {
      success: true,
      data: {
        examId: lastSession.examId,
        examCode: lastSession.examCode,
        examName: lastSession.examName,
        lastStudiedAt: lastSession.lastActivityAt,
        questionsAnswered,
        accuracy,
        progress,
        mode
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch last session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch last session'
    })
  }
})