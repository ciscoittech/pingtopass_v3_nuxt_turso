import { testSessionService } from '~/server/utils/sessions'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const examId = query.examId as string | undefined
  
  try {
    const sessions = await testSessionService.getUserHistory(user.id, {
      page,
      limit,
      examId,
      includeDetails: query.details === 'true'
    })
    
    // Transform sessions for frontend consumption
    const history = sessions.data.map(session => ({
      id: session.id,
      examId: session.examId,
      examCode: session.examCode,
      examName: session.examName,
      status: session.status,
      score: session.score,
      correctCount: session.correctCount,
      incorrectCount: session.incorrectCount,
      unansweredCount: session.unansweredCount,
      totalQuestions: session.totalQuestions,
      passingScore: session.passingScore,
      passed: session.score ? session.score >= session.passingScore : false,
      timeSpentSeconds: session.timeSpentSeconds,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      createdAt: session.createdAt
    }))
    
    console.log(`[Test History] Retrieved ${history.length} sessions for user ${user.id}`)
    
    return {
      success: true,
      data: {
        sessions: history,
        pagination: {
          page,
          limit,
          total: sessions.total,
          pages: Math.ceil(sessions.total / limit),
          hasNext: page * limit < sessions.total,
          hasPrev: page > 1
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to get test history:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to retrieve test history'
    })
  }
})