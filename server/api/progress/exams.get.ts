import { useDB } from '~/server/utils/db'
import { studyActivity, testSessions, exams, userProgress } from '~/server/database/schema'
import { eq, desc, and, gte, inArray } from 'drizzle-orm'

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

    const userId = session.user.id
    const query = getQuery(event)
    const timeframe = (query.timeframe as string) || 'all' // 'week', 'month', 'quarter', 'all'

    // Calculate date filter
    let dateFilter = undefined
    if (timeframe !== 'all') {
      const now = Math.floor(Date.now() / 1000)
      let daysBack = 30 // month default
      
      switch (timeframe) {
        case 'week':
          daysBack = 7
          break
        case 'quarter':
          daysBack = 90
          break
      }
      
      dateFilter = now - (daysBack * 24 * 60 * 60)
    }

    const db = useDB()
    
    // Get all exams user has interacted with
    let activityQuery = db
      .select({
        examId: studyActivity.examId,
        activityType: studyActivity.activityType,
        questionsAnswered: studyActivity.questionsAnswered,
        correctAnswers: studyActivity.correctAnswers,
        timeSpent: studyActivity.timeSpent,
        score: studyActivity.score,
        timestamp: studyActivity.timestamp
      })
      .from(studyActivity)
      .where(eq(studyActivity.userId, userId))

    if (dateFilter) {
      activityQuery = activityQuery.where(gte(studyActivity.timestamp, dateFilter))
    }

    const activities = await activityQuery.orderBy(desc(studyActivity.timestamp))

    // Get exam details
    const examIds = [...new Set(activities.map(a => a.examId).filter(Boolean))]
    const examDetails = examIds.length > 0 
      ? await db
          .select()
          .from(exams)
          .where(inArray(exams.id, examIds))
      : []

    // Process exam statistics
    const examStats = new Map()

    activities.forEach(activity => {
      if (!activity.examId) return

      if (!examStats.has(activity.examId)) {
        examStats.set(activity.examId, {
          examId: activity.examId,
          totalStudyTime: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          studySessions: 0,
          testsTaken: 0,
          bestTestScore: 0,
          averageTestScore: 0,
          testScores: [],
          lastActivity: 0,
          accuracyTrend: [],
          weeklyProgress: new Map()
        })
      }

      const stats = examStats.get(activity.examId)
      
      stats.totalStudyTime += activity.timeSpent || 0
      stats.totalQuestions += activity.questionsAnswered || 0
      stats.totalCorrect += activity.correctAnswers || 0
      stats.lastActivity = Math.max(stats.lastActivity, activity.timestamp || 0)

      if (activity.activityType === 'study_session') {
        stats.studySessions++
      } else if (activity.activityType === 'test_completed' && activity.score !== null) {
        stats.testsTaken++
        stats.testScores.push(activity.score)
        stats.bestTestScore = Math.max(stats.bestTestScore, activity.score)
      }

      // Track weekly progress for trends
      const weekKey = Math.floor((activity.timestamp || 0) / (7 * 24 * 60 * 60))
      if (!stats.weeklyProgress.has(weekKey)) {
        stats.weeklyProgress.set(weekKey, { questions: 0, correct: 0 })
      }
      const weekStats = stats.weeklyProgress.get(weekKey)
      weekStats.questions += activity.questionsAnswered || 0
      weekStats.correct += activity.correctAnswers || 0
    })

    // Calculate derived metrics
    const examPerformance = Array.from(examStats.values()).map(stats => {
      // Calculate average test score
      if (stats.testScores.length > 0) {
        stats.averageTestScore = stats.testScores.reduce((sum, score) => sum + score, 0) / stats.testScores.length
      }

      // Calculate overall accuracy
      const accuracy = stats.totalQuestions > 0 ? (stats.totalCorrect / stats.totalQuestions) * 100 : 0

      // Calculate mastery level
      let masteryLevel = 'beginner'
      if (stats.testsTaken >= 3 && stats.averageTestScore >= 90) {
        masteryLevel = 'expert'
      } else if (stats.testsTaken >= 2 && stats.averageTestScore >= 80) {
        masteryLevel = 'advanced'
      } else if (stats.testsTaken >= 1 && stats.averageTestScore >= 70) {
        masteryLevel = 'intermediate'
      }

      // Calculate improvement trend
      const recentScores = stats.testScores.slice(-3)
      const olderScores = stats.testScores.slice(0, -3)
      let improvementTrend = 'stable'
      
      if (recentScores.length >= 2 && olderScores.length >= 1) {
        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
        const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length
        
        if (recentAvg > olderAvg + 5) {
          improvementTrend = 'improving'
        } else if (recentAvg < olderAvg - 5) {
          improvementTrend = 'declining'
        }
      }

      // Find exam details
      const examDetail = examDetails.find(e => e.id === stats.examId)

      return {
        exam: examDetail ? {
          id: examDetail.id,
          name: examDetail.name,
          code: examDetail.code,
          description: examDetail.description
        } : {
          id: stats.examId,
          name: 'Unknown Exam',
          code: 'UNK',
          description: ''
        },
        statistics: {
          totalStudyTime: stats.totalStudyTime,
          totalQuestions: stats.totalQuestions,
          totalCorrect: stats.totalCorrect,
          accuracy: Math.round(accuracy * 10) / 10,
          studySessions: stats.studySessions,
          testsTaken: stats.testsTaken,
          bestTestScore: stats.bestTestScore,
          averageTestScore: Math.round(stats.averageTestScore * 10) / 10,
          masteryLevel,
          improvementTrend,
          lastActivity: stats.lastActivity,
          recentScores: stats.testScores.slice(-5) // Last 5 test scores
        }
      }
    })

    // Sort by last activity (most recent first)
    examPerformance.sort((a, b) => b.statistics.lastActivity - a.statistics.lastActivity)

    // Calculate overall summary
    const overallStats = {
      totalExams: examPerformance.length,
      totalStudyTime: examPerformance.reduce((sum, exam) => sum + exam.statistics.totalStudyTime, 0),
      totalQuestions: examPerformance.reduce((sum, exam) => sum + exam.statistics.totalQuestions, 0),
      totalCorrect: examPerformance.reduce((sum, exam) => sum + exam.statistics.totalCorrect, 0),
      averageAccuracy: 0,
      strongestExam: null as any,
      weakestExam: null as any,
      mostStudiedExam: null as any
    }

    if (overallStats.totalQuestions > 0) {
      overallStats.averageAccuracy = (overallStats.totalCorrect / overallStats.totalQuestions) * 100
    }

    // Find strongest/weakest exams
    if (examPerformance.length > 0) {
      overallStats.strongestExam = examPerformance.reduce((best, current) => 
        current.statistics.accuracy > best.statistics.accuracy ? current : best
      )
      
      overallStats.weakestExam = examPerformance.reduce((worst, current) => 
        current.statistics.accuracy < worst.statistics.accuracy ? current : worst
      )
      
      overallStats.mostStudiedExam = examPerformance.reduce((most, current) => 
        current.statistics.totalStudyTime > most.statistics.totalStudyTime ? current : most
      )
    }

    return {
      success: true,
      data: {
        timeframe,
        examPerformance,
        overallStats
      }
    }

  } catch (error) {
    console.error('Get exam performance error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})