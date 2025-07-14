import { z } from 'zod'
import { db } from '~/server/database/db'
import { studyActivity, userProgress, userStreaks } from '~/server/database/schema'
import { eq, gte, lte, and, desc } from 'drizzle-orm'

const analyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  examId: z.string().optional()
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

    // Validate query parameters
    const query = getQuery(event)
    const { period, examId } = analyticsQuerySchema.parse(query)

    const userId = session.user.id

    // Calculate date range
    const now = new Date()
    const endDate = Math.floor(now.getTime() / 1000)
    let startDate: number

    switch (period) {
      case 'week':
        startDate = endDate - (7 * 24 * 60 * 60)
        break
      case 'quarter':
        startDate = endDate - (90 * 24 * 60 * 60)
        break
      case 'year':
        startDate = endDate - (365 * 24 * 60 * 60)
        break
      default: // month
        startDate = endDate - (30 * 24 * 60 * 60)
    }

    // Build activity query
    let activityQuery = db
      .select()
      .from(studyActivity)
      .where(
        and(
          eq(studyActivity.userId, userId),
          gte(studyActivity.timestamp, startDate),
          lte(studyActivity.timestamp, endDate)
        )
      )

    if (examId) {
      activityQuery = activityQuery.where(eq(studyActivity.examId, examId))
    }

    const activities = await activityQuery.orderBy(desc(studyActivity.timestamp))

    // Process activities for analytics
    const dailyStats = new Map<string, {
      date: string
      studyTime: number
      questionsAnswered: number
      correctAnswers: number
      accuracy: number
      sessions: number
      tests: number
    }>()

    activities.forEach(activity => {
      const date = new Date(activity.timestamp * 1000).toISOString().split('T')[0]
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          date,
          studyTime: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracy: 0,
          sessions: 0,
          tests: 0
        })
      }

      const dayStats = dailyStats.get(date)!
      dayStats.studyTime += activity.timeSpent || 0
      dayStats.questionsAnswered += activity.questionsAnswered || 0
      dayStats.correctAnswers += activity.correctAnswers || 0
      
      if (activity.activityType === 'study_session') {
        dayStats.sessions++
      } else if (activity.activityType === 'test_completed') {
        dayStats.tests++
      }
    })

    // Calculate accuracy for each day
    dailyStats.forEach(dayStats => {
      dayStats.accuracy = dayStats.questionsAnswered > 0 
        ? (dayStats.correctAnswers / dayStats.questionsAnswered) * 100 
        : 0
    })

    // Get overall progress and streaks
    const [progressData, streakData] = await Promise.all([
      db.select().from(userProgress).where(eq(userProgress.userId, userId)).get(),
      db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).get()
    ])

    // Calculate period totals
    const periodTotals = Array.from(dailyStats.values()).reduce((totals, day) => ({
      totalStudyTime: totals.totalStudyTime + day.studyTime,
      totalQuestions: totals.totalQuestions + day.questionsAnswered,
      totalCorrect: totals.totalCorrect + day.correctAnswers,
      totalSessions: totals.totalSessions + day.sessions,
      totalTests: totals.totalTests + day.tests
    }), {
      totalStudyTime: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalSessions: 0,
      totalTests: 0
    })

    // Calculate performance trends
    const dailyArray = Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date))
    const accuracyTrend = calculateTrend(dailyArray.map(d => d.accuracy))
    const studyTimeTrend = calculateTrend(dailyArray.map(d => d.studyTime))

    return {
      success: true,
      data: {
        period,
        dateRange: {
          start: new Date(startDate * 1000).toISOString(),
          end: new Date(endDate * 1000).toISOString()
        },
        dailyStats: Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date)),
        periodTotals: {
          ...periodTotals,
          averageAccuracy: periodTotals.totalQuestions > 0 
            ? (periodTotals.totalCorrect / periodTotals.totalQuestions) * 100 
            : 0,
          averageStudyTime: dailyArray.length > 0 
            ? periodTotals.totalStudyTime / dailyArray.length 
            : 0
        },
        trends: {
          accuracy: accuracyTrend,
          studyTime: studyTimeTrend
        },
        streaks: {
          current: streakData?.currentDailyStreak || 0,
          longest: streakData?.longestDailyStreak || 0,
          answerStreak: streakData?.currentAnswerStreak || 0
        },
        goals: {
          weekly: {
            target: progressData?.weeklyGoal || 0,
            current: progressData?.weeklyProgress || 0,
            percentage: progressData?.weeklyGoal 
              ? (progressData.weeklyProgress || 0) / progressData.weeklyGoal * 100 
              : 0
          },
          monthly: {
            target: progressData?.monthlyGoal || 0,
            current: progressData?.monthlyProgress || 0,
            percentage: progressData?.monthlyGoal 
              ? (progressData.monthlyProgress || 0) / progressData.monthlyGoal * 100 
              : 0
          }
        }
      }
    }

  } catch (error) {
    console.error('Get analytics error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper function to calculate trend (positive/negative/neutral)
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (change > 5) return 'increasing'
  if (change < -5) return 'decreasing'
  return 'stable'
}