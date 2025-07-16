import { requireAuth } from '~/server/utils/auth'
import { studySessionService } from '~/server/utils/sessions'
import { examService } from '~/server/utils/examService'
import { objectiveService } from '~/server/utils/objectiveService'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const examId = query.examId as string
  
  try {
    // Get all sessions for the user (filtered by exam if specified)
    const sessions = await studySessionService.getAllForUser(user.id, examId)
    
    if (sessions.length === 0) {
      return {
        success: true,
        data: {
          totalSessions: 0,
          totalTimeSpent: 0,
          totalQuestionsAnswered: 0,
          overallAccuracy: 0,
          sessionsByMode: {},
          performanceByObjective: [],
          recentSessions: [],
          weakAreas: [],
          strongAreas: []
        }
      }
    }
    
    // Calculate aggregate statistics
    let totalTimeSpent = 0
    let totalQuestionsAnswered = 0
    let totalCorrect = 0
    const sessionsByMode: Record<string, number> = {}
    const objectivePerformance: Record<string, { correct: number; total: number }> = {}
    
    // Process each session
    for (const session of sessions) {
      totalTimeSpent += session.timeSpentSeconds || 0
      
      // Count sessions by mode
      sessionsByMode[session.mode] = (sessionsByMode[session.mode] || 0) + 1
      
      // Process answers
      if (session.answers) {
        const answers = JSON.parse(session.answers) as Record<string, any>
        
        for (const answer of Object.values(answers)) {
          if (answer && answer.questionId) {
            totalQuestionsAnswered++
            if (answer.isCorrect) totalCorrect++
          }
        }
      }
    }
    
    // Calculate overall accuracy
    const overallAccuracy = totalQuestionsAnswered > 0 
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) 
      : 0
    
    // Get recent sessions (last 5)
    const recentSessions = sessions
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 5)
      .map(session => {
        const answers = session.answers ? JSON.parse(session.answers) : {}
        const answeredCount = Object.keys(answers).length
        const correctCount = Object.values(answers).filter((a: any) => a?.isCorrect).length
        
        return {
          id: session.id,
          examId: session.examId,
          mode: session.mode,
          status: session.status,
          startedAt: new Date(session.startedAt).toISOString(),
          totalQuestions: session.totalQuestions,
          questionsAnswered: answeredCount,
          correctAnswers: correctCount,
          accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
          timeSpentSeconds: session.timeSpentSeconds || 0
        }
      })
    
    // Identify weak areas (objectives with < 60% accuracy)
    const weakAreas = Object.entries(objectivePerformance)
      .map(([objectiveId, stats]) => ({
        objectiveId,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        totalQuestions: stats.total
      }))
      .filter(area => area.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
    
    // Identify strong areas (objectives with >= 80% accuracy)
    const strongAreas = Object.entries(objectivePerformance)
      .map(([objectiveId, stats]) => ({
        objectiveId,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        totalQuestions: stats.total
      }))
      .filter(area => area.accuracy >= 80)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
    
    // Performance trends (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const recentSessionsForTrend = sessions.filter(s => s.startedAt >= sevenDaysAgo)
    
    const performanceTrend = recentSessionsForTrend.map(session => {
      const answers = session.answers ? JSON.parse(session.answers) : {}
      const answeredCount = Object.keys(answers).length
      const correctCount = Object.values(answers).filter((a: any) => a?.isCorrect).length
      
      return {
        date: new Date(session.startedAt).toISOString().split('T')[0],
        accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
        questionsAnswered: answeredCount
      }
    })
    
    return {
      success: true,
      data: {
        totalSessions: sessions.length,
        totalTimeSpent,
        totalQuestionsAnswered,
        totalCorrect,
        overallAccuracy,
        sessionsByMode,
        recentSessions,
        weakAreas,
        strongAreas,
        performanceTrend,
        averageSessionTime: Math.round(totalTimeSpent / sessions.length),
        averageQuestionsPerSession: Math.round(totalQuestionsAnswered / sessions.length)
      }
    }
    
  } catch (error: any) {
    console.error('Failed to get analytics:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to retrieve analytics'
    })
  }
})